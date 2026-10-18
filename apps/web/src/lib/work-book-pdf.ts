import { folioLabel, formatWorkBookDay, type WorkBookDocumentModel } from "./work-book";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 48;
const LINE = 13;
const MAX_CHARS = 92;

const WIN_ANSI: Record<string, number> = {
  Á: 0xc1,
  É: 0xc9,
  Í: 0xcd,
  Ó: 0xd3,
  Ú: 0xda,
  Ñ: 0xd1,
  Ü: 0xdc,
  á: 0xe1,
  é: 0xe9,
  í: 0xed,
  ó: 0xf3,
  ú: 0xfa,
  ñ: 0xf1,
  ü: 0xfc,
  "¿": 0xbf,
  "¡": 0xa1,
  "°": 0xb0,
  "º": 0xba,
  "ª": 0xaa,
  "–": 0x96,
  "—": 0x97,
  "“": 0x93,
  "”": 0x94,
  "‘": 0x91,
  "’": 0x92,
  "·": 0xb7,
};

function pdfLiteral(value: string) {
  let out = "(";
  for (const char of value.replace(/\r?\n/g, " ")) {
    if (char === "\\" || char === "(" || char === ")") {
      out += `\\${char}`;
      continue;
    }
    const mapped = WIN_ANSI[char] ?? char.charCodeAt(0);
    if (mapped < 32 || mapped > 126) {
      out += `\\${mapped.toString(8).padStart(3, "0")}`;
    } else {
      out += char;
    }
  }
  return `${out})`;
}

function wrapText(value: string, width = MAX_CHARS) {
  const words = value.trim() ? value.replace(/\s+/g, " ").split(" ") : ["—"];
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function dash(y: number) {
  return `0.4 w ${MARGIN} ${y} m ${PAGE_W - MARGIN} ${y} l S`;
}

function field(label: string, value: string, x: number, y: number, size = 9) {
  return `BT /F2 ${size} Tf ${x} ${y} Td ${pdfLiteral(`${label}:`)} Tj ET BT /F1 ${size} Tf ${x + 92} ${y} Td ${pdfLiteral(value || "—")} Tj ET`;
}

function buildPageContent(commands: string[]) {
  const stream = commands.join("\n");
  return `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
}

function coverCommands(model: WorkBookDocumentModel) {
  const { header } = model;
  let y = 780;
  const cmds = [
    "BT /F2 16 Tf 48 800 Td (LIBRO DE OBRA) Tj ET",
    "BT /F1 9 Tf 48 784 Td (Copia de trabajo para fiscalizacion o registro de evento. No es el libro electronico inmutable del MOP.) Tj ET",
    dash(778),
    field("Obra", header.obra, MARGIN, (y -= LINE)),
    field("Codigo", header.code, MARGIN, (y -= LINE)),
    field("N. contrato", header.contractNumber, MARGIN, (y -= LINE)),
    field("Mandante", `${header.mandante} ${header.mandanteRut}`.trim(), MARGIN, (y -= LINE)),
    field("Contratista", `${header.contratista} ${header.contratistaRut}`.trim(), MARGIN, (y -= LINE)),
    field("Ubicacion", header.location, MARGIN, (y -= LINE)),
    field("ITO titular", header.itoName, MARGIN, (y -= LINE)),
    field("Rep. contratista", header.contractorRep, MARGIN, (y -= LINE)),
    field("Plazo", `${formatWorkBookDay(header.startDate)} al ${formatWorkBookDay(header.finishDate)}`, MARGIN, (y -= LINE)),
    field("Tipo contrato", header.contractType, MARGIN, (y -= LINE)),
    field("Emision", formatWorkBookDay(header.issuedAt), MARGIN, (y -= LINE)),
    field("Folios", header.folioCount ? `${folioLabel(header.folioFrom)} a ${folioLabel(header.folioTo)}` : "Sin anotaciones", MARGIN, (y -= LINE)),
    dash((y -= 8)),
    `BT /F2 11 Tf ${MARGIN} ${y -= 18} Td (Indice de anotaciones) Tj ET`,
  ];
  const index = model.folios.slice(0, 28);
  index.forEach((item) => {
    y -= LINE;
    cmds.push(
      `BT /F1 8 Tf ${MARGIN} ${y} Td ${pdfLiteral(`${folioLabel(item.folio)}  ${formatWorkBookDay(item.occurredOn)}  ${item.kindLabel}  ${item.body.slice(0, 70)}`)} Tj ET`,
    );
  });
  if (model.folios.length > index.length) {
    y -= LINE;
    cmds.push(`BT /F1 8 Tf ${MARGIN} ${y} Td ${pdfLiteral(`... ${model.folios.length - index.length} folios mas en las hojas siguientes`)} Tj ET`);
  }
  y = 130;
  cmds.push(dash(y + 24));
  cmds.push(`BT /F1 9 Tf ${MARGIN} ${y} Td (______________________________) Tj ET`);
  cmds.push(`BT /F1 8 Tf ${MARGIN} ${y - 14} Td (Contratista / representante) Tj ET`);
  cmds.push(`BT /F1 9 Tf 330 ${y} Td (______________________________) Tj ET`);
  cmds.push(`BT /F1 8 Tf 330 ${y - 14} Td (ITO / Inspeccion Tecnica de Obra) Tj ET`);
  cmds.push(`BT /F1 7 Tf ${MARGIN} 40 Td (OpenEVM. Los espacios de firma se completan a mano. Esta copia no sustituye el soporte inmutable que exijan MOP u otros mandantes publicos.) Tj ET`);
  return cmds;
}

function folioCommands(model: WorkBookDocumentModel, folio: WorkBookDocumentModel["folios"][number], page: number, total: number) {
  const { header } = model;
  let y = 790;
  const cmds = [
    "BT /F2 13 Tf 48 812 Td (LIBRO DE OBRA) Tj ET",
    `BT /F1 8 Tf 400 812 Td ${pdfLiteral(`Hoja ${page} de ${total}`)} Tj ET`,
    `BT /F1 8 Tf 48 798 Td ${pdfLiteral(`${header.obra}  ·  ${header.contractNumber}`)} Tj ET`,
    dash(792),
    field("Folio", folioLabel(folio.folio), MARGIN, (y -= LINE)),
    field("Fecha", formatWorkBookDay(folio.occurredOn), MARGIN, (y -= LINE)),
    field("Hora", folio.occurredTime || "—", MARGIN, (y -= LINE)),
    field("Tipo", folio.kindLabel, MARGIN, (y -= LINE)),
    field("Clima", folio.weather, MARGIN, (y -= LINE)),
    field("Frente / lugar", folio.location, MARGIN, (y -= LINE)),
    field("Registrado por", `${folio.recordedBy} · ${folio.recordedRole}`, MARGIN, (y -= LINE)),
  ];
  if (folio.extra) {
    cmds.push(field("Referencia", folio.extra, MARGIN, (y -= LINE)));
  }
  y -= 10;
  cmds.push(dash(y));
  cmds.push(`BT /F2 10 Tf ${MARGIN} ${y -= 16} Td (Anotacion) Tj ET`);
  wrapText(folio.body, 88).forEach((line) => {
    y -= LINE;
    cmds.push(`BT /F1 10 Tf ${MARGIN} ${y} Td ${pdfLiteral(line)} Tj ET`);
  });
  if (folio.evidenceFileName) {
    y -= LINE + 4;
    cmds.push(field("Respaldo", folio.evidenceFileName, MARGIN, y));
  }
  y = 130;
  cmds.push(dash(y + 24));
  cmds.push(`BT /F1 9 Tf ${MARGIN} ${y} Td (______________________________) Tj ET`);
  cmds.push(`BT /F1 8 Tf ${MARGIN} ${y - 14} Td (Firma contratista) Tj ET`);
  cmds.push(`BT /F1 9 Tf 330 ${y} Td (______________________________) Tj ET`);
  cmds.push(`BT /F1 8 Tf 330 ${y - 14} Td (V B ITO / inspeccion tecnica) Tj ET`);
  cmds.push(`BT /F1 7 Tf ${MARGIN} 40 Td ${pdfLiteral(`Mandante: ${header.mandante || "—"}  ·  Contratista: ${header.contratista || "—"}  ·  Copia de trabajo OpenEVM`)} Tj ET`);
  return cmds;
}

export function buildWorkBookPdf(model: WorkBookDocumentModel) {
  const pages = [coverCommands(model), ...model.folios.map((folio, index) => folioCommands(model, folio, index + 2, model.folios.length + 1))];
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  const pageIds = pages.map((_, index) => 3 + index);
  const contentIds = pages.map((_, index) => 3 + pages.length + index);
  objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  pages.forEach((_, index) => {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentIds[index]} 0 R /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R /F2 ${4 + pages.length * 2} 0 R >> >> >>`,
    );
  });
  pages.forEach((commands) => {
    objects.push(buildPageContent(commands));
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefAt = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  const bytes = new Uint8Array(body.length);
  for (let i = 0; i < body.length; i += 1) bytes[i] = body.charCodeAt(i) & 0xff;
  return bytes;
}

export function downloadWorkBookPdf(model: WorkBookDocumentModel, fileName: string) {
  const bytes = buildWorkBookPdf(model);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
