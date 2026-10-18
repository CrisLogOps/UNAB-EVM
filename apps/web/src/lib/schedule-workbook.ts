import { buildXlsx, readXlsxSheetTables, type SheetCell, type SheetSpec, unzip, zipStore } from "./ooxml";
import {
  SCHEDULE_CSV_DISPLAY_HEADERS,
  parseScheduleCsv,
  parseScheduleMatrix,
  shiftTemplateRows,
  type ScheduleCsvRow,
} from "./schedule-csv";

export type ScheduleWorkbookMeta = {
  projectName: string;
  projectCode: string;
  start: string;
  finish: string;
  example: boolean;
  budgetClp?: number;
};

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function fileSafe(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").trim() || "OBRA";
}

function bookTitle(meta: ScheduleWorkbookMeta) {
  const name = meta.projectName.trim() || "Proyecto";
  const code = meta.projectCode.trim() || "OBRA";
  return `${code} — ${name}`;
}

function instructionSheet(meta: ScheduleWorkbookMeta, split: boolean): SheetSpec {
  const code = meta.projectCode || "OBRA";
  const name = meta.projectName || "Proyecto";
  const kind = meta.example ? "EJEMPLO de plantilla EDT (debe editarse antes de usarlo como línea base)" : "Cronograma de la obra";
  const rows: SheetCell[][] = [
    [{ v: `OpenEVM — Instrucciones del cronograma`, s: 1 }, { v: "", s: 1 }],
    [{ v: `Libro: ${bookTitle(meta)}`, s: 2 }, { v: "", s: 2 }],
    [
      {
        v: meta.example
          ? "Este archivo es un ejemplo. Edita la hoja Cronograma y súbela de nuevo a OpenEVM."
          : "Edita la hoja Cronograma y súbela de nuevo a OpenEVM para actualizar la línea base.",
        s: 5,
      },
      { v: "", s: 5 },
    ],
    [],
    [{ v: "Datos de la obra", s: 2 }, ""],
    ["Nombre del proyecto", name],
    ["Código", code],
    ["Inicio previsto", meta.start || "—"],
    ["Término previsto", meta.finish || "—"],
    [
      "Presupuesto inicial (CLP)",
      meta.budgetClp && meta.budgetClp > 0
        ? `${meta.budgetClp.toLocaleString("es-CL")} · repartido en las partidas de la hoja Cronograma`
        : "Aún no hay presupuesto registrado. Cárgalo en OpenEVM → Presupuesto antes de usar esta plantilla como línea base.",
    ],
    ["Estado del archivo", kind],
    [
      "Hojas de este libro",
      split
        ? "Este libro solo trae las instrucciones. El cronograma está en el segundo libro."
        : "1) Instrucciones (esta hoja)  ·  2) Cronograma (datos para editar y subir)",
    ],
    [],
    [{ v: "Qué debes hacer", s: 2 }, ""],
    [
      "1. Leer esta hoja",
      "Aquí está el detalle del proyecto y las reglas del formato. No subas esta hoja como si fueran partidas: OpenEVM la ignora.",
    ],
    [
      "2. Editar el cronograma",
      split
        ? `Abre el libro «${code} - Cronograma.xlsx». Completa, borra o agrega filas según la obra real.`
        : "Abre la pestaña Cronograma (abajo). Completa, borra o agrega filas según la obra real. No borres la fila de encabezados.",
    ],
    [
      "3. Respetar el plazo",
      `Las fechas de ejemplo ya están repartidas entre ${meta.start || "el inicio previsto"} y ${meta.finish || "el término previsto"} registrados al crear el proyecto. Ajústalas si una partida empieza o termina en otro día.`,
    ],
    [
      "4. Guardar y subir",
      split
        ? `En OpenEVM → Cronograma → Subir cronograma, carga el libro «${code} - Cronograma.xlsx» (no este de instrucciones).`
        : "En OpenEVM → Cronograma → Subir cronograma, carga este mismo archivo .xlsx. El sistema lee solo la hoja Cronograma.",
    ],
    [
      "5. Dividir en 2 libros (opcional)",
      split
        ? "Ya estás usando la versión dividida: un libro de instrucciones y otro de cronograma. Sube únicamente el del cronograma."
        : `Clic derecho en la pestaña Cronograma → Mover o copiar → Nuevo libro. Guarda «${code} - Instrucciones.xlsx» y «${code} - Cronograma.xlsx». También puedes usar en OpenEVM el botón «Descargar 2 libros».`,
    ],
    [],
    [{ v: "Columnas de la hoja Cronograma (no cambies los nombres)", s: 2 }, ""],
    ["Código EDT", "Identificador único, por ejemplo 1.0, 1.1, 2.3. Obligatorio."],
    ["EDT padre", "Código del paquete del que cuelga. Vacío si es el primer nivel (1.0, 2.0…)."],
    ["Tipo de elemento", "Uno de: Paquete de trabajo | Actividad | Inspección en terreno | Hito."],
    ["Fase", "Etapa de la obra: Preliminares, Obra Gruesa, Instalaciones, Terminaciones, Exteriores, Cierre y Recepción, u otra."],
    ["Nombre", "Nombre de la partida o el hito. Obligatorio."],
    ["Fecha de inicio", "Formato AAAA-MM-DD, por ejemplo 2026-10-01. Obligatorio."],
    ["Fecha de término", "Formato AAAA-MM-DD. No puede ser anterior al inicio. En un hito, inicio y término son el mismo día."],
    ["Responsable", "Cargo o perfil (Administrador de Obra, Constructor Civil, ITO, Jefe de faena, Contratista, etc.)."],
    ["Presupuesto planificado (CLP)", "Monto entero en pesos, sin símbolo $. Ejemplo: 15000000."],
    ["Inspección en terreno", "Sí o No. Sí = esa partida exige evidencia de faena para reportar avance."],
    [],
    [{ v: "Reglas al editar", s: 2 }, ""],
    ["Fila de encabezados", "No la borres ni traduzcas los títulos. OpenEVM las reconoce por esos nombres."],
    ["Paquetes", "Un paquete resume varias actividades. Llévalo con EDT padre vacío."],
    ["Actividades", "Cuelgan de un paquete. Indica el EDT padre."],
    ["Inspecciones", "Controles en terreno. Marca Inspección en terreno = Sí."],
    ["Hitos", "Punto de control (recepción, DOM, etc.). Misma fecha de inicio y término."],
    ["Filas de más o de menos", "Puedes agregar partidas propias o borrar las de ejemplo. El archivo que subas reemplaza el cronograma de ejemplo."],
    ["CSV", "Si Excel te pide guardar como CSV, exporta solo la hoja Cronograma, con las mismas columnas, separado por ; o ,."],
  ];
  return {
    name: "Instrucciones",
    tabColor: "FFD97706",
    colWidths: [36, 92],
    freezeRows: 3,
    merges: ["A1:B1", "A2:B2", "A3:B3"],
    rows,
  };
}

function cronogramaSheet(dataRows: string[][]): SheetSpec {
  const header: SheetCell[] = SCHEDULE_CSV_DISPLAY_HEADERS.map((label) => ({ v: label, s: 3 }));
  const rows: SheetCell[][] = [
    header,
    ...dataRows.map((row) =>
      row.map((value, index) => {
        if (index === 8) {
          const amount = Number(String(value).replace(/\./g, "").replace(/,/g, ""));
          return Number.isFinite(amount) && String(value).trim() ? { v: amount, s: 4 } : value;
        }
        return value;
      }),
    ),
  ];
  return {
    name: "Cronograma",
    tabColor: "FF0F3D3A",
    colWidths: [14, 12, 26, 20, 48, 16, 16, 28, 28, 22],
    freezeRows: 1,
    rows,
  };
}

export function buildScheduleWorkbookBytes(meta: ScheduleWorkbookMeta, dataRows: string[][]): Uint8Array {
  return buildXlsx(bookTitle(meta), [instructionSheet(meta, false), cronogramaSheet(dataRows)]);
}

export function buildScheduleInstructionBookBytes(meta: ScheduleWorkbookMeta): Uint8Array {
  return buildXlsx(`${bookTitle(meta)} — Instrucciones`, [instructionSheet(meta, true)]);
}

export function buildScheduleDataBookBytes(meta: ScheduleWorkbookMeta, dataRows: string[][]): Uint8Array {
  return buildXlsx(`${bookTitle(meta)} — Cronograma`, [cronogramaSheet(dataRows)]);
}

export function scheduleWorkbookFilename(meta: ScheduleWorkbookMeta, example: boolean) {
  const prefix = example ? "plantilla-cronograma-edt" : "cronograma-edt";
  return `${prefix}-${fileSafe(meta.projectCode || "OBRA")}.xlsx`;
}

export function buildCombinedScheduleFile(meta: ScheduleWorkbookMeta, dataRows: string[][]) {
  const bytes = buildScheduleWorkbookBytes(meta, dataRows);
  return {
    filename: scheduleWorkbookFilename(meta, meta.example),
    blob: new Blob([new Uint8Array(bytes)], { type: XLSX_MIME }),
  };
}

export function buildSplitScheduleZip(meta: ScheduleWorkbookMeta, dataRows: string[][]) {
  const code = fileSafe(meta.projectCode || "OBRA");
  const instructionsName = `${code} - Instrucciones.xlsx`;
  const scheduleName = `${code} - Cronograma.xlsx`;
  const zip = zipStore([
    { name: instructionsName, data: buildScheduleInstructionBookBytes(meta) },
    { name: scheduleName, data: buildScheduleDataBookBytes(meta, dataRows) },
  ]);
  return {
    filename: `${meta.example ? "plantilla-cronograma-edt" : "cronograma-edt"}-${code}-2-libros.zip`,
    blob: new Blob([new Uint8Array(zip)], { type: "application/zip" }),
  };
}

export function templateOrActivityRows(dataRows: string[][] | undefined, start: string, finish: string): string[][] {
  if (dataRows?.length) return dataRows;
  return shiftTemplateRows(start, finish);
}

function normalizeSheetKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function pickCronogramaSheet(sheets: { name: string; rows: string[][] }[]) {
  const named = sheets.find((sheet) => normalizeSheetKey(sheet.name).includes("cronograma"));
  if (named?.rows.length) return named;
  const withHeaders = sheets.find((sheet) => parseScheduleMatrix(sheet.rows).rows.length);
  return withHeaders ?? sheets[0];
}

export async function parseScheduleXlsx(buffer: ArrayBuffer): Promise<{ rows: ScheduleCsvRow[]; errors: string[] }> {
  const sheets = await readXlsxSheetTables(buffer);
  if (!sheets.length) return { rows: [], errors: ["El libro Excel no tiene hojas."] };
  const chosen = pickCronogramaSheet(sheets);
  if (!chosen) return { rows: [], errors: ["No se encontró la hoja Cronograma."] };
  return parseScheduleMatrix(chosen.rows);
}

export async function parseScheduleUpload(file: File): Promise<{ rows: ScheduleCsvRow[]; errors: string[] }> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt") || file.type.includes("csv")) {
    return parseScheduleCsv(await file.text());
  }
  const buffer = await file.arrayBuffer();
  if (name.endsWith(".zip")) {
    const files = await unzip(buffer);
    const xlsxNames = Object.keys(files).filter((item) => item.toLowerCase().endsWith(".xlsx") && !item.startsWith("__MACOSX"));
    const preferred =
      xlsxNames.find((item) => normalizeSheetKey(item).includes("cronograma")) ??
      xlsxNames.find((item) => !normalizeSheetKey(item).includes("instruccion")) ??
      xlsxNames[0];
    if (!preferred) return { rows: [], errors: ["El ZIP no contiene un libro Excel de cronograma."] };
    const bytes = files[preferred];
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    return parseScheduleXlsx(copy.buffer as ArrayBuffer);
  }
  return parseScheduleXlsx(buffer);
}
