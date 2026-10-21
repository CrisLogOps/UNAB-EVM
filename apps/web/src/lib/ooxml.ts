const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    table[i] = crc >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = ~0;
  for (let i = 0; i < data.length; i += 1) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return ~crc >>> 0;
}

function u16(value: number): Uint8Array {
  const out = new Uint8Array(2);
  out[0] = value & 0xff;
  out[1] = (value >>> 8) & 0xff;
  return out;
}

function u32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = value & 0xff;
  out[1] = (value >>> 8) & 0xff;
  out[2] = (value >>> 16) & 0xff;
  out[3] = (value >>> 24) & 0xff;
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

const encoder = new TextEncoder();

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ZipEntry = { name: string; data: Uint8Array | string };

export function zipStore(entries: ZipEntry[]): Uint8Array {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name.replace(/\\/g, "/"));
    const data = typeof entry.data === "string" ? encoder.encode(entry.data) : entry.data;
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      data,
    ]);
    const central = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  });
  const localBlob = concat(locals);
  const centralBlob = concat(centrals);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralBlob.length),
    u32(localBlob.length),
    u16(0),
  ]);
  return concat([localBlob, centralBlob, end]);
}

function readU16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function readU32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

function asArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Este navegador no puede leer archivos Excel comprimidos.");
  }
  const stream = new Blob([asArrayBuffer(data)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function unzip(buffer: ArrayBuffer): Promise<Record<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let eocd = bytes.length - 22;
  while (eocd >= 0 && readU32(view, eocd) !== 0x06054b50) eocd -= 1;
  if (eocd < 0) throw new Error("El archivo Excel no es un libro válido.");
  const count = readU16(view, eocd + 10);
  let offset = readU32(view, eocd + 16);
  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < count; i += 1) {
    if (readU32(view, offset) !== 0x02014b50) break;
    const method = readU16(view, offset + 10);
    const compressed = readU32(view, offset + 20);
    const nameLen = readU16(view, offset + 28);
    const extraLen = readU16(view, offset + 30);
    const commentLen = readU16(view, offset + 32);
    const localOff = readU32(view, offset + 42);
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLen));
    const localNameLen = readU16(view, localOff + 26);
    const localExtra = readU16(view, localOff + 28);
    const dataStart = localOff + 30 + localNameLen + localExtra;
    const packed = bytes.subarray(dataStart, dataStart + compressed);
    files[name.replace(/\\/g, "/")] = method === 0 ? packed.slice() : await inflateRaw(packed);
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

export function decodeUtf8(data: Uint8Array): string {
  return new TextDecoder("utf-8").decode(data);
}

export function colLetter(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export function parseCellRef(ref: string): { row: number; col: number } {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return { row: 1, col: 0 };
  const letters = match[1].toUpperCase();
  let col = 0;
  for (let i = 0; i < letters.length; i += 1) col = col * 26 + (letters.charCodeAt(i) - 64);
  return { row: Number(match[2]), col: col - 1 };
}

export type SheetCell = string | number | { v: string | number; s?: number };
export type SheetSpec = {
  name: string;
  tabColor?: string;
  colWidths: number[];
  freezeRows?: number;
  merges?: string[];
  rows: SheetCell[][];
};

function cellValue(cell: SheetCell): string | number {
  return typeof cell === "object" ? cell.v : cell;
}

function cellStyle(cell: SheetCell): number | undefined {
  return typeof cell === "object" ? cell.s : undefined;
}

function sheetXml(spec: SheetSpec): string {
  const cols = spec.colWidths
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join("");
  const freeze = spec.freezeRows
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${spec.freezeRows}" topLeftCell="A${spec.freezeRows + 1}" state="frozen"/></sheetView></sheetViews>`
    : "";
  const data = spec.rows
    .map((row, rowIndex) => {
      const r = rowIndex + 1;
      const cells = row
        .map((cell, colIndex) => {
          const ref = `${colLetter(colIndex)}${r}`;
          const style = cellStyle(cell);
          const styleAttr = style != null ? ` s="${style}"` : "";
          const value = cellValue(cell);
          if (typeof value === "number" && Number.isFinite(value)) {
            return `<c r="${ref}"${styleAttr}><v>${value}</v></c>`;
          }
          const text = xmlEscape(String(value ?? ""));
          return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t xml:space="preserve">${text}</t></is></c>`;
        })
        .join("");
      return `<row r="${r}">${cells}</row>`;
    })
    .join("");
  const merges = spec.merges?.length
    ? `<mergeCells count="${spec.merges.length}">${spec.merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`
    : "";
  const tab = spec.tabColor ? `<sheetPr><tabColor rgb="${spec.tabColor}"/></sheetPr>` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${tab}${freeze}<cols>${cols}</cols><sheetData>${data}</sheetData>${merges}</worksheet>`;
}

function stylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts>
  <fonts count="5">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="18"/><color rgb="FF0F3D3A"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FF0F3D3A"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><sz val="11"/><color rgb="FF7A2E0B"/><name val="Calibri"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0F3D3A"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF7ED"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf/></cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="0" fontId="4" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
  </cellXfs>
</styleSheet>`;
}

function sanitizeSheetName(name: string): string {
  const clean = name.replace(/[:\\/?*[\]]/g, " ").trim() || "Hoja";
  return clean.slice(0, 31);
}

export function buildXlsx(title: string, sheets: SheetSpec[]): Uint8Array {
  const named = sheets.map((sheet, index) => ({ ...sheet, name: sanitizeSheetName(sheet.name || `Hoja${index + 1}`) }));
  const workbookSheets = named
    .map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join("");
  const workbookRels = named
    .map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`)
    .join("");
  const contentSheets = named
    .map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join("");
  const appTitles = named.map((sheet) => `<vt:lpstr>${xmlEscape(sheet.name)}</vt:lpstr>`).join("");
  const files: ZipEntry[] = [
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${contentSheets}
</Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: "docProps/core.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xmlEscape(title)}</dc:title>
  <dc:subject>Cronograma EDT OpenEVM</dc:subject>
  <dc:creator>OpenEVM</dc:creator>
  <cp:lastModifiedBy>OpenEVM</cp:lastModifiedBy>
</cp:coreProperties>`,
    },
    {
      name: "docProps/app.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>OpenEVM</Application>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Hojas de cálculo</vt:lpstr></vt:variant><vt:variant><vt:i4>${named.length}</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="${named.length}" baseType="lpstr">${appTitles}</vt:vector></TitlesOfParts>
</Properties>`,
    },
    {
      name: "xl/workbook.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${workbookSheets}</sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRels}
  <Relationship Id="rId${named.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { name: "xl/styles.xml", data: stylesXml() },
  ];
  named.forEach((sheet, index) => {
    files.push({ name: `xl/worksheets/sheet${index + 1}.xml`, data: sheetXml(sheet) });
  });
  return zipStore(files);
}

function localName(el: Element) {
  return el.localName || el.tagName.replace(/^.*:/, "");
}

function descendants(root: ParentNode, name: string): Element[] {
  return [...root.querySelectorAll("*")].filter((el) => el instanceof Element && localName(el) === name) as Element[];
}

function textOf(el: Element | null): string {
  if (!el) return "";
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

export async function readXlsxSheetTables(buffer: ArrayBuffer): Promise<{ name: string; rows: string[][] }[]> {
  const files = await unzip(buffer);
  const workbookXml = files["xl/workbook.xml"];
  const relsXml = files["xl/_rels/workbook.xml.rels"];
  if (!workbookXml || !relsXml) throw new Error("El libro Excel no tiene la estructura esperada.");
  const workbook = new DOMParser().parseFromString(decodeUtf8(workbookXml), "application/xml");
  const rels = new DOMParser().parseFromString(decodeUtf8(relsXml), "application/xml");
  const relMap = new Map<string, string>();
  descendants(rels, "Relationship").forEach((rel) => {
    const id = rel.getAttribute("Id") || "";
    const target = (rel.getAttribute("Target") || "").replace(/^\//, "");
    const path = target.startsWith("xl/") ? target : `xl/${target.replace(/^\.\//, "")}`;
    relMap.set(id, path);
  });
  const shared = files["xl/sharedStrings.xml"]
    ? descendants(new DOMParser().parseFromString(decodeUtf8(files["xl/sharedStrings.xml"]), "application/xml"), "si").map(
        (si) =>
          descendants(si, "t")
            .map((t) => t.textContent ?? "")
            .join(""),
      )
    : [];
  return descendants(workbook, "sheet").map((sheet) => {
    const name = sheet.getAttribute("name") || "Hoja";
    const relId =
      sheet.getAttribute("r:id") ||
      sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ||
      "";
    const path = relMap.get(relId);
    const xml = path ? files[path] : undefined;
    if (!xml) return { name, rows: [] as string[][] };
    const doc = new DOMParser().parseFromString(decodeUtf8(xml), "application/xml");
    const rows: string[][] = [];
    descendants(doc, "row").forEach((rowEl) => {
      const line: string[] = [];
      descendants(rowEl, "c").forEach((cell) => {
        const ref = cell.getAttribute("r") || "";
        const { col } = parseCellRef(ref);
        const type = cell.getAttribute("t") || "";
        let value = "";
        if (type === "s") {
          const idx = Number(textOf(descendants(cell, "v")[0] ?? null));
          value = shared[idx] ?? "";
        } else if (type === "inlineStr" || type === "str") {
          value =
            descendants(cell, "t")
              .map((t) => t.textContent ?? "")
              .join("") || textOf(descendants(cell, "v")[0] ?? null);
        } else {
          value = textOf(descendants(cell, "v")[0] ?? null);
        }
        line[col] = value;
      });
      rows.push(line.map((cell) => cell ?? ""));
    });
    return { name, rows };
  });
}
