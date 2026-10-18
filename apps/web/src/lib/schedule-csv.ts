import { ROLE_LABELS } from "./constants";
import type { GanttActivity, ProgressReport, ScheduleElementKind, UserRole } from "./types";

/** Columnas que ve el jefe de proyecto en Excel (PMBOK / construcción). */
export const SCHEDULE_CSV_DISPLAY_HEADERS = [
  "Código EDT",
  "EDT padre",
  "Tipo de elemento",
  "Fase",
  "Nombre",
  "Fecha de inicio",
  "Fecha de término",
  "Responsable",
  "Presupuesto planificado (CLP)",
  "Inspección en terreno",
] as const;

export const ELEMENT_KIND_LABELS: Record<ScheduleElementKind, string> = {
  paquete: "Paquete de trabajo",
  actividad: "Actividad",
  hito: "Hito",
  inspeccion: "Inspección en terreno",
};

const HEADER_ALIASES: Record<
  "code" | "parent" | "kind" | "phase" | "name" | "start" | "finish" | "role" | "budget" | "inspect",
  string[]
> = {
  code: ["codigo_edt", "codigo_wbs", "wbs", "edt", "codigo"],
  parent: ["edt_padre", "codigo_edt_padre", "wbs_padre", "codigo_padre", "padre"],
  kind: ["tipo_de_elemento", "tipo_elemento", "tipo"],
  phase: ["fase", "fase_de_obra", "etapa"],
  name: ["nombre", "nombre_del_entregable", "entregable", "actividad", "descripcion"],
  start: ["fecha_de_inicio", "fecha_inicio", "inicio"],
  finish: ["fecha_de_termino", "fecha_termino", "fecha_de_fin", "termino", "fin"],
  role: ["responsable", "perfil", "rol"],
  budget: ["presupuesto_planificado", "presupuesto_planificado_clp", "valor_planificado", "presupuesto_clp", "pv"],
  inspect: ["inspeccion_en_terreno", "inspeccion_terreno", "validacion_terreno", "control_en_terreno"],
};

export const SCHEDULE_PROFILE_ALIASES: Record<string, UserRole> = {
  operaciones: "field",
  terreno: "field",
  field: "field",
  "operaciones / terreno": "field",
  "operaciones a terreno": "field",
  pmo: "pmo",
  pm: "pmo",
  "gerente de proyectos": "pmo",
  "jefe de proyecto": "pmo",
  "gestor de proyectos": "pmo",
  finanzas: "finance",
  comercial: "commercial",
  bodega: "warehouse",
  logistica: "warehouse",
  warehouse: "warehouse",
  "oficina tecnica": "oficina_tecnica",
  ito: "oficina_tecnica",
  "topografo / ito": "oficina_tecnica",
  "ito / especialista": "oficina_tecnica",
  "ito / especialistas": "oficina_tecnica",
  "ito / constructor": "oficina_tecnica",
  "jefe de faena": "admin_obra",
  "administrador de obra": "admin_obra",
  "constructor civil": "field",
  "jefe de especialidades": "field",
  "jefe de operaciones": "field",
  "instalador sanitario": "subcontractor",
  "instalador electrico": "subcontractor",
  "especialista hvac": "subcontractor",
  "contratista terminaciones": "subcontractor",
  "contratista obras ext": "subcontractor",
  "contratista obras ext.": "subcontractor",
  "contratista paisajismo": "subcontractor",
  subcontrato: "subcontractor",
  subcontratos: "subcontractor",
  administrador: "owner",
  "administrador / propietario": "owner",
  admin: "owner",
};

export function profileToken(role: UserRole | ""): string {
  if (role === "field") return "Operaciones / Terreno";
  if (role === "pmo") return "Gerente de proyectos";
  if (role === "finance") return "Finanzas";
  if (role === "commercial") return "Comercial";
  if (role === "owner") return "Administrador";
  if (!role) return "";
  return ROLE_LABELS[role];
}

export function parseProfileToken(value: string): UserRole | "" {
  const key = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.+$/g, "")
    .replace(/\s+/g, " ");
  if (!key) return "";
  return SCHEDULE_PROFILE_ALIASES[key] ?? "";
}

function normalizeHeaderToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (ch === sep && !quoted) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

function detectSeparator(headerLine: string): string {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  return semis >= commas ? ";" : ",";
}

function excelSerialToIso(serial: number): string {
  const utc = Date.UTC(1899, 11, 30) + Math.round(serial) * 24 * 60 * 60 * 1000;
  const date = new Date(utc);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDate(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, "0");
    const m = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${m}-${d}`;
  }
  if (/^\d{5}(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial >= 20000 && serial <= 80000) return excelSerialToIso(serial);
  }
  return null;
}

function parseYes(value: string): boolean {
  const key = value.trim().toLowerCase();
  return key === "si" || key === "sí" || key === "1" || key === "true" || key === "x";
}

export function parseElementKind(value: string): ScheduleElementKind | "" {
  const key = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!key) return "";
  if (key.includes("hito") || key.includes("milestone")) return "hito";
  if (key.includes("paquete") || key.includes("work package") || key.includes("resumen")) return "paquete";
  if (
    key.includes("inspeccion") ||
    key.includes("subtarea") ||
    key.includes("control en terreno") ||
    key.includes("validacion")
  ) {
    return "inspeccion";
  }
  if (key.includes("actividad") || key === "activity") return "actividad";
  return "";
}

export function inferElementKind(input: {
  tipo: string;
  parentCode: string;
  requiresFieldEvidence: boolean;
  start: string;
  end: string;
}): ScheduleElementKind {
  const parsed = parseElementKind(input.tipo);
  if (parsed) return parsed;
  if (input.requiresFieldEvidence) return "inspeccion";
  if (input.start === input.end && !input.parentCode) return "hito";
  if (input.parentCode) return "actividad";
  return "paquete";
}

export type ScheduleCsvRow = Omit<GanttActivity, "id" | "projectId" | "progress">;

export function parseScheduleMatrix(table: string[][]): { rows: ScheduleCsvRow[]; errors: string[] } {
  const usable = table
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some((cell) => cell));
  const errors: string[] = [];
  if (!usable.length) return { rows: [], errors: ["El archivo está vacío."] };

  const headerAt = usable.findIndex((row) => {
    if ((row[0] ?? "").startsWith("#")) return false;
    const header = row.map(normalizeHeaderToken);
    const has = (field: keyof typeof HEADER_ALIASES) => HEADER_ALIASES[field].some((alias) => header.includes(alias));
    return has("code") && has("name") && has("start") && has("finish");
  });
  if (headerAt < 0) {
    return {
      rows: [],
      errors: [
        "No se encontró la hoja o fila de encabezados del cronograma. Usa la hoja Cronograma de la plantilla (Código EDT, Nombre, Fecha de inicio y Fecha de término).",
      ],
    };
  }

  const header = usable[headerAt].map(normalizeHeaderToken);
  const get = (cells: string[], field: keyof typeof HEADER_ALIASES) => {
    for (const alias of HEADER_ALIASES[field]) {
      const i = header.indexOf(alias);
      if (i >= 0) return cells[i] ?? "";
    }
    return "";
  };

  const rows: ScheduleCsvRow[] = [];
  usable.slice(headerAt + 1).forEach((cells, index) => {
    if ((cells[0] ?? "").startsWith("#")) return;
    const code = get(cells, "code");
    const name = get(cells, "name");
    const start = normalizeDate(get(cells, "start"));
    const end = normalizeDate(get(cells, "finish"));
    const lineNo = headerAt + index + 2;
    if (!code && !name && !start && !end) return;
    if (!code || !name || !start || !end) {
      errors.push(
        `Fila ${lineNo}: Código EDT, Nombre, Fecha de inicio y Fecha de término son obligatorios (AAAA-MM-DD).`,
      );
      return;
    }
    if (end < start) {
      errors.push(`Fila ${lineNo}: la fecha de término no puede ser anterior al inicio.`);
      return;
    }
    const parentRaw = get(cells, "parent").trim();
    const parentCode = parentRaw === code ? "" : parentRaw;
    const tipo = get(cells, "kind");
    const kindHint = parseElementKind(tipo);
    const isChild = Boolean(parentCode) || kindHint === "inspeccion" || kindHint === "actividad";
    const profile = parseProfileToken(get(cells, "role"));
    const inspectRaw = get(cells, "inspect");
    const requiresFieldEvidence = inspectRaw
      ? parseYes(inspectRaw)
      : kindHint === "inspeccion" || (isChild && kindHint !== "hito" && (profile === "field" || profile === ""));
    const elementKind = inferElementKind({
      tipo,
      parentCode,
      requiresFieldEvidence,
      start,
      end,
    });
    const budgetRaw = get(cells, "budget").replace(/\./g, "").replace(/,/g, "");
    rows.push({
      code,
      parentCode: isChild ? parentCode || inferParentCode(code) : elementKind === "hito" ? parentCode : "",
      stage: get(cells, "phase") || "General",
      name,
      start,
      end,
      assigneeRole: profile || (requiresFieldEvidence ? "field" : elementKind === "hito" ? "pmo" : ""),
      budgetPv: Number(budgetRaw) || 0,
      elementKind,
      requiresFieldEvidence: elementKind === "hito" && !parseYes(inspectRaw) ? false : requiresFieldEvidence,
      baselineStart: start,
      baselineFinish: end,
    });
  });

  return { rows, errors };
}

export function parseScheduleCsv(text: string): { rows: ScheduleCsvRow[]; errors: string[] } {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((line) => line.trim());
  if (!lines.length) return { rows: [], errors: ["El archivo está vacío."] };
  const headerLine = lines.find((line) => !line.trim().startsWith("#")) ?? lines[0];
  const sep = detectSeparator(headerLine);
  return parseScheduleMatrix(lines.map((line) => splitCsvLine(line, sep)));
}

function inferParentCode(code: string): string {
  const parts = code.split(".");
  if (parts.length < 2) return "";
  return parts.slice(0, -1).join(".");
}

/** Plantilla estándar EDT de construcción (paquetes, actividades, inspecciones e hitos). */
export const STANDARD_SCHEDULE_TEMPLATE_ROWS: string[][] = [
  ["1.0", "", "Paquete de trabajo", "Preliminares", "Trabajos Previos y Preliminares", "2026-06-15", "2026-07-15", "Administrador de Obra", "15000000", "No"],
  ["1.1", "1.0", "Actividad", "Preliminares", "Instalación de faenas y empalmes prov.", "2026-06-15", "2026-06-30", "Constructor Civil", "8000000", "Sí"],
  ["1.2", "1.0", "Actividad", "Preliminares", "Trazado, replanteo y despeje", "2026-06-20", "2026-07-05", "Topógrafo / ITO", "3000000", "Sí"],
  ["1.3", "1.0", "Actividad", "Preliminares", "Movimiento de tierras y excavaciones", "2026-06-25", "2026-07-15", "Constructor Civil", "4000000", "Sí"],
  ["2.0", "", "Paquete de trabajo", "Obra Gruesa", "Estructura e Infraestructura", "2026-07-16", "2026-10-15", "Administrador de Obra", "180000000", "No"],
  ["2.1", "2.0", "Actividad", "Obra Gruesa", "Cimentaciones y fundaciones", "2026-07-16", "2026-08-15", "Constructor Civil", "45000000", "Sí"],
  ["2.2", "2.0", "Actividad", "Obra Gruesa", "Estructura vertical (Muros y pilares)", "2026-08-01", "2026-09-01", "Constructor Civil", "50000000", "Sí"],
  ["2.3", "2.0", "Actividad", "Obra Gruesa", "Estructura horizontal (Losas y vigas)", "2026-08-20", "2026-09-25", "Constructor Civil", "60000000", "Sí"],
  ["2.4", "2.0", "Actividad", "Obra Gruesa", "Estructura de techumbre y cubierta", "2026-09-20", "2026-10-15", "Constructor Civil", "25000000", "Sí"],
  ["3.0", "", "Paquete de trabajo", "Instalaciones", "Especialidades y Redes Ocultas", "2026-09-01", "2026-12-15", "Jefe de Especialidades", "90000000", "No"],
  ["3.1", "3.0", "Actividad", "Instalaciones", "Redes sanitarias (agua y alcantarillado)", "2026-09-01", "2026-10-30", "Instalador Sanitario", "25000000", "Sí"],
  ["3.2", "3.0", "Actividad", "Instalaciones", "Canalización eléctrica y corrientes débiles", "2026-09-10", "2026-11-15", "Instalador Eléctrico", "30000000", "Sí"],
  ["3.3", "3.0", "Actividad", "Instalaciones", "Climatización (HVAC) y Red de Gas", "2026-10-01", "2026-11-30", "Especialista HVAC", "25000000", "Sí"],
  ["3.4", "3.0", "Inspección en terreno", "Instalaciones", "Pruebas de hermeticidad y redes ocultas", "2026-12-01", "2026-12-15", "ITO / Especialista", "10000000", "Sí"],
  ["4.0", "", "Paquete de trabajo", "Terminaciones", "Acabados y Revestimientos", "2026-11-15", "2027-03-15", "Administrador de Obra", "75000000", "No"],
  ["4.1", "4.0", "Actividad", "Terminaciones", "Estucados, tabiquería y aislación", "2026-11-15", "2026-12-30", "Contratista Terminaciones", "20000000", "Sí"],
  ["4.2", "4.0", "Actividad", "Terminaciones", "Pavimentos, pisos e impermeabilización", "2026-12-01", "2027-01-20", "Contratista Terminaciones", "18000000", "Sí"],
  ["4.3", "4.0", "Actividad", "Terminaciones", "Revestimientos, pinturas y cielos", "2027-01-05", "2027-02-15", "Contratista Terminaciones", "15000000", "Sí"],
  ["4.4", "4.0", "Actividad", "Terminaciones", "Puertas, ventanas y quincallería", "2027-02-01", "2027-03-01", "Contratista Terminaciones", "12000000", "No"],
  ["4.5", "4.0", "Actividad", "Terminaciones", "Artefactos sanitarios e iluminación", "2027-02-20", "2027-03-15", "Contratista Terminaciones", "10000000", "Sí"],
  ["5.0", "", "Paquete de trabajo", "Exteriores", "Obras Exteriores y Paisajismo", "2027-02-01", "2027-04-01", "Administrador de Obra", "25000000", "No"],
  ["5.1", "5.0", "Actividad", "Exteriores", "Pavimentos exteriores y cierros perimétricos", "2027-02-01", "2027-03-10", "Contratista Obras Ext.", "15000000", "Sí"],
  ["5.2", "5.0", "Actividad", "Exteriores", "Paisajismo, jardines e iluminación ext.", "2027-03-01", "2027-04-01", "Contratista Paisajismo", "10000000", "No"],
  ["6.0", "", "Paquete de trabajo", "Cierre y Recepción", "Pruebas, Aceptación y Recepción DOM", "2027-03-15", "2027-05-15", "Administrador de Obra", "15000000", "No"],
  ["6.1", "6.0", "Actividad", "Cierre y Recepción", "Limpieza fina de la obra", "2027-03-15", "2027-03-30", "Jefe de Operaciones", "3000000", "No"],
  ["6.2", "6.0", "Inspección en terreno", "Cierre y Recepción", "Pruebas operacionales y Marcha Blanca", "2027-04-01", "2027-04-15", "ITO / Especialistas", "4000000", "Sí"],
  ["6.3", "6.0", "Inspección en terreno", "Cierre y Recepción", "Recepción Técnica ITO y lev. de observaciones", "2027-04-10", "2027-04-30", "ITO / Constructor", "5000000", "Sí"],
  ["6.4", "6.0", "Hito", "Cierre y Recepción", "Solicitud de Recepción Definitiva (DOM)", "2027-05-01", "2027-05-15", "Administrador / Propietario", "3000000", "No"],
];

function csvCell(value: string): string {
  if (/[;"\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export const TEMPLATE_ANCHOR_START = "2026-06-15";
export const TEMPLATE_ANCHOR_FINISH = "2027-05-15";

function isoToUtcNoon(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0);
}

function utcNoonToIso(ms: number) {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Reparte una fecha del EDT de ejemplo sobre el inicio y término reales de la obra. */
export function mapTemplateDate(iso: string, projectStart: string, projectFinish: string) {
  if (!projectStart || !projectFinish) return iso;
  const source = isoToUtcNoon(iso);
  const t0 = isoToUtcNoon(TEMPLATE_ANCHOR_START);
  const t1 = isoToUtcNoon(TEMPLATE_ANCHOR_FINISH);
  const p0 = isoToUtcNoon(projectStart);
  const p1 = isoToUtcNoon(projectFinish);
  const spanT = Math.max(t1 - t0, 24 * 60 * 60 * 1000);
  const spanP = Math.max(p1 - p0, 24 * 60 * 60 * 1000);
  const ratio = Math.min(1, Math.max(0, (source - t0) / spanT));
  return utcNoonToIso(p0 + ratio * spanP);
}

export function shiftTemplateRows(projectStart: string, projectFinish: string): string[][] {
  if (!projectStart || !projectFinish) return STANDARD_SCHEDULE_TEMPLATE_ROWS.map((row) => [...row]);
  return STANDARD_SCHEDULE_TEMPLATE_ROWS.map((row) => {
    const rawStart = mapTemplateDate(row[5], projectStart, projectFinish);
    const rawEnd = mapTemplateDate(row[6], projectStart, projectFinish);
    const start = rawEnd < rawStart ? rawEnd : rawStart;
    const end = rawEnd < rawStart ? rawStart : rawEnd;
    return [row[0], row[1], row[2], row[3], row[4], start, end, row[7], row[8], row[9]];
  });
}

function scheduleCsvWithRows(
  rows: string[][],
  projectCode: string,
  start: string,
  finish: string,
  example: boolean,
) {
  const code = projectCode || "OBRA";
  const comments = example
    ? [
        `# EJEMPLO — cronograma plantilla EDT. Proyecto: ${code}.`,
        `# Fechas ajustadas al plazo de la obra (${start || "—"} a ${finish || "—"}). Edita este archivo y súbelo de nuevo.`,
        "# No borres la fila de encabezados. Tipos: Paquete de trabajo | Actividad | Inspección en terreno | Hito.",
        "# Fechas en AAAA-MM-DD. Inspección en terreno: Sí o No.",
      ]
    : [
        `# Cronograma EDT. Proyecto: ${code}.`,
        "# No borres la fila de encabezados. Tipos: Paquete de trabajo | Actividad | Inspección en terreno | Hito.",
        `# Fechas en AAAA-MM-DD${start && finish ? ` (obra: ${start} a ${finish})` : ""}. Inspección en terreno: Sí o No.`,
      ];
  const header = SCHEDULE_CSV_DISPLAY_HEADERS.map(csvCell).join(";");
  const body = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  return `\uFEFF${comments.join("\n")}\n${header}\n${body}\n`;
}

export function buildScheduleTemplateCsv(projectCode = "", start = "", finish = ""): string {
  return scheduleCsvWithRows(shiftTemplateRows(start, finish), projectCode, start, finish, true);
}

export function scheduleGridFromActivities(activities: GanttActivity[]): string[][] {
  return [...activities]
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    .map((item) => [
      item.code,
      item.parentCode,
      ELEMENT_KIND_LABELS[item.elementKind],
      item.stage,
      item.name,
      item.start,
      item.end,
      profileToken(item.assigneeRole),
      String(item.budgetPv || 0),
      item.requiresFieldEvidence ? "Sí" : "No",
    ]);
}

export function buildScheduleCsvFromActivities(
  activities: GanttActivity[],
  meta: { projectCode?: string; start?: string; finish?: string; example?: boolean } = {},
): string {
  return scheduleCsvWithRows(
    scheduleGridFromActivities(activities),
    meta.projectCode ?? "",
    meta.start ?? "",
    meta.finish ?? "",
    Boolean(meta.example),
  );
}

export function leafActivities(activities: GanttActivity[]): GanttActivity[] {
  return activities.filter(
    (item) => item.elementKind !== "hito" && childrenOf(activities, item.code).length === 0,
  );
}

function isUnderPackage(item: GanttActivity, packageCode: string, all: GanttActivity[]) {
  if (item.code === packageCode) return true;
  let parent = item.parentCode;
  const seen = new Set<string>();
  while (parent && !seen.has(parent)) {
    if (parent === packageCode) return true;
    seen.add(parent);
    parent = all.find((row) => row.code === parent)?.parentCode ?? "";
  }
  return false;
}

/** Reparte el presupuesto registrado entre las partidas hoja y resume los paquetes. */
export function scaleActivitiesToBudget(activities: GanttActivity[], bac: number): GanttActivity[] {
  if (!(bac > 0) || !activities.length) return activities;
  const leaves = leafActivities(activities);
  if (!leaves.length) return activities;
  const weights = leaves.map((item) => Math.max(item.budgetPv || 0, 1));
  const total = weights.reduce((sum, value) => sum + value, 0);
  const amounts = new Map<string, number>();
  let remaining = Math.round(bac);
  leaves.forEach((item, index) => {
    if (index === leaves.length - 1) {
      amounts.set(item.id, Math.max(0, remaining));
      return;
    }
    const amount = Math.max(0, Math.round((weights[index] / total) * bac));
    amounts.set(item.id, amount);
    remaining -= amount;
  });
  return activities.map((item) => {
    const leafAmount = amounts.get(item.id);
    if (leafAmount != null) return { ...item, budgetPv: leafAmount };
    if (item.elementKind === "hito") return { ...item, budgetPv: 0 };
    const rolled = leaves
      .filter((leaf) => isUnderPackage(leaf, item.code, activities))
      .reduce((sum, leaf) => sum + (amounts.get(leaf.id) ?? 0), 0);
    return { ...item, budgetPv: rolled };
  });
}

export function defaultScheduleActivities(
  projectId: string,
  start: string,
  finish: string,
  bac = 0,
): GanttActivity[] {
  const { rows } = parseScheduleCsv(buildScheduleTemplateCsv("", start, finish));
  const activities = rows.map((row, index) =>
    normalizeGanttActivity({
      ...row,
      id: `g-ex-${projectId}-${index}`,
      projectId,
      progress: 0,
    }),
  );
  return bac > 0 ? scaleActivitiesToBudget(activities, bac) : activities;
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, contents: string, mime = "text/csv;charset=utf-8") {
  downloadBlob(filename, new Blob([contents], { type: mime }));
}

export function normalizeGanttActivity(
  item: Partial<GanttActivity> & Pick<GanttActivity, "id" | "projectId" | "name" | "start" | "end">,
): GanttActivity {
  const start = item.start;
  const end = item.end;
  const parentCode = item.parentCode && item.parentCode === (item.code ?? "") ? "" : (item.parentCode ?? "");
  const assigneeRole = item.assigneeRole ?? "";
  const requiresFieldEvidence =
    item.requiresFieldEvidence ?? (Boolean(parentCode) && (assigneeRole === "field" || assigneeRole === ""));
  const elementKind =
    item.elementKind ??
    inferElementKind({
      tipo: "",
      parentCode,
      requiresFieldEvidence,
      start,
      end,
    });
  return {
    id: item.id,
    projectId: item.projectId,
    name: item.name,
    start,
    end,
    progress: item.progress ?? 0,
    code: item.code ?? "",
    stage: item.stage ?? "",
    assigneeRole,
    budgetPv: item.budgetPv ?? 0,
    parentCode,
    elementKind,
    requiresFieldEvidence,
    baselineStart: item.baselineStart || start,
    baselineFinish: item.baselineFinish || end,
  };
}

export function childrenOf(activities: GanttActivity[], code: string): GanttActivity[] {
  if (!code) return [];
  return activities.filter((item) => item.parentCode === code && item.code !== code);
}

export function isSummaryActivity(activities: GanttActivity[], item: GanttActivity): boolean {
  return childrenOf(activities, item.code).length > 0 && !item.parentCode;
}

export function hasScheduleDeviation(item: GanttActivity): boolean {
  return item.start !== item.baselineStart || item.end !== item.baselineFinish;
}

export function rolledProgress(
  item: GanttActivity,
  activities: GanttActivity[],
  reports: ProgressReport[] = [],
  seen: Set<string> = new Set(),
): number {
  const key = item.id || item.code;
  if (key && seen.has(key)) return item.progress ?? 0;
  if (key) seen.add(key);
  const children = childrenOf(activities, item.code).filter((child) => (child.id || child.code) !== key);
  if (!children.length) {
    const validated = reports.some(
      (report) => report.taskId === item.id && report.evidenceStatus === "validated",
    );
    if (validated) return item.progress;
    if (activityRequiresEvidence(item) && item.progress === 0) return 0;
    return item.progress;
  }
  const measurable = children.filter((child) => child.elementKind !== "hito" || child.requiresFieldEvidence);
  const leaves = measurable.filter((child) => !childrenOf(activities, child.code).length);
  const pool = leaves.length ? leaves : measurable.length ? measurable : children;
  const nextSeen = new Set(seen);
  const total = pool.reduce((sum, child) => sum + rolledProgress(child, activities, reports, nextSeen), 0);
  return Math.round(total / pool.length);
}

export function fieldEvidenceActivities(activities: GanttActivity[]): GanttActivity[] {
  return activities.filter((item) => isFieldEvidenceActivity(item, activities));
}

export function isFieldEvidenceActivity(item: GanttActivity, activities: GanttActivity[]) {
  if (item.elementKind === "hito" && !item.requiresFieldEvidence) return false;
  if (item.elementKind === "paquete") return false;
  if (childrenOf(activities, item.code).length) return false;
  if (item.requiresFieldEvidence || item.elementKind === "inspeccion") return true;
  return item.assigneeRole === "field" || item.assigneeRole === "subcontractor";
}

/** El avance de esta partida cuenta cuando hay evidencia validada (foto en terreno o documento de otra área). */
export function activityRequiresEvidence(item: GanttActivity) {
  if (item.elementKind === "paquete") return false;
  if (item.elementKind === "hito") return item.requiresFieldEvidence;
  return item.requiresFieldEvidence || item.elementKind === "inspeccion" || Boolean(item.assigneeRole);
}

export function reportableActivitiesForRole(
  activities: GanttActivity[],
  role: UserRole,
  ownerCovers = false,
): GanttActivity[] {
  const candidates = activities.filter((item) => {
    if (item.elementKind === "paquete") return false;
    if (childrenOf(activities, item.code).length) return false;
    if (item.elementKind === "hito" && !item.requiresFieldEvidence) return false;
    return activityRequiresEvidence(item);
  });
  if (ownerCovers || role === "owner") return candidates;
  if (role === "field") {
    return candidates.filter(
      (item) =>
        item.assigneeRole === "field" ||
        item.assigneeRole === "" ||
        item.requiresFieldEvidence ||
        item.elementKind === "inspeccion",
    );
  }
  if (role === "subcontractor") {
    return candidates.filter((item) => item.assigneeRole === "subcontractor");
  }
  return candidates.filter((item) => item.assigneeRole === role);
}

export function isOfficeEvidenceActivity(item: GanttActivity, activities: GanttActivity[]) {
  return activityRequiresEvidence(item) && !isFieldEvidenceActivity(item, activities);
}
