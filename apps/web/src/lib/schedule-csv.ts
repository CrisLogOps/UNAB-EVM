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
  finanzas: "finance",
  comercial: "commercial",
  bodega: "warehouse",
  logistica: "warehouse",
  warehouse: "warehouse",
  "oficina tecnica": "oficina_tecnica",
  "jefe de faena": "admin_obra",
  "administrador de obra": "admin_obra",
  subcontrato: "subcontractor",
  subcontratos: "subcontractor",
  administrador: "owner",
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
  const key = value.trim().toLowerCase();
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

export function parseScheduleCsv(text: string): { rows: ScheduleCsvRow[]; errors: string[] } {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((line) => line.trim());
  const errors: string[] = [];
  if (!lines.length) return { rows: [], errors: ["El archivo está vacío."] };

  const sep = detectSeparator(lines[0]);
  const header = splitCsvLine(lines[0], sep).map(normalizeHeaderToken);
  const has = (field: keyof typeof HEADER_ALIASES) => HEADER_ALIASES[field].some((alias) => header.includes(alias));
  const missingLabels: string[] = [];
  if (!has("code")) missingLabels.push("Código EDT");
  if (!has("name")) missingLabels.push("Nombre");
  if (!has("start")) missingLabels.push("Fecha de inicio");
  if (!has("finish")) missingLabels.push("Fecha de término");
  if (missingLabels.length) {
    return {
      rows: [],
      errors: [`Faltan columnas: ${missingLabels.join(", ")}. Descarga la plantilla e inténtalo de nuevo.`],
    };
  }

  const get = (cells: string[], field: keyof typeof HEADER_ALIASES) => {
    for (const alias of HEADER_ALIASES[field]) {
      const i = header.indexOf(alias);
      if (i >= 0) return cells[i] ?? "";
    }
    return "";
  };

  const rows: ScheduleCsvRow[] = [];
  lines.slice(1).forEach((line, index) => {
    const cells = splitCsvLine(line, sep);
    const code = get(cells, "code");
    const name = get(cells, "name");
    const start = normalizeDate(get(cells, "start"));
    const end = normalizeDate(get(cells, "finish"));
    const lineNo = index + 2;
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
    const parentCode = get(cells, "parent").trim();
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

function inferParentCode(code: string): string {
  const parts = code.split(".");
  if (parts.length < 2) return "";
  return parts.slice(0, -1).join(".");
}

export function buildScheduleTemplateCsv(projectCode: string, start: string, finish: string): string {
  const code = projectCode || "CP-001";
  const header = SCHEDULE_CSV_DISPLAY_HEADERS.join(";");
  const samples = [
    [
      `${code}.1`,
      "",
      "Paquete de trabajo",
      "Inducción",
      "Capacitación inicial del equipo",
      start,
      finish,
      "Gerente de proyectos",
      "0",
      "No",
    ],
    [
      `${code}.1.1`,
      `${code}.1`,
      "Actividad",
      "Inducción",
      "Presentación de la plataforma",
      start,
      finish,
      "Gerente de proyectos",
      "0",
      "No",
    ],
    [
      `${code}.1.2`,
      `${code}.1`,
      "Inspección en terreno",
      "Inducción",
      "Lista de asistencia en faena",
      start,
      start,
      "Operaciones / Terreno",
      "0",
      "Sí",
    ],
    [
      `${code}.1.3`,
      `${code}.1`,
      "Inspección en terreno",
      "Inducción",
      "Verificación del puesto de trabajo",
      start,
      start,
      "Operaciones / Terreno",
      "0",
      "Sí",
    ],
    [
      `${code}.1.4`,
      `${code}.1`,
      "Hito",
      "Inducción",
      "Inducción completada",
      start,
      start,
      "Gerente de proyectos",
      "0",
      "No",
    ],
    [
      `${code}.2`,
      "",
      "Paquete de trabajo",
      "Práctica",
      "Uso de la plataforma en faena",
      start,
      finish,
      "Gerente de proyectos",
      "0",
      "No",
    ],
    [
      `${code}.2.1`,
      `${code}.2`,
      "Inspección en terreno",
      "Práctica",
      "Carga de avance con evidencia",
      start,
      finish,
      "Operaciones / Terreno",
      "0",
      "Sí",
    ],
    [
      `${code}.2.2`,
      `${code}.2`,
      "Actividad",
      "Práctica",
      "Conciliación de costos del periodo",
      start,
      finish,
      "Finanzas",
      "0",
      "No",
    ],
    [
      `${code}.2.3`,
      `${code}.2`,
      "Hito",
      "Práctica",
      "Línea base del cronograma confirmada",
      finish,
      finish,
      "Gerente de proyectos",
      "0",
      "No",
    ],
  ];
  const body = samples.map((row) => row.join(";")).join("\n");
  return `\uFEFF${header}\n${body}\n`;
}

export function downloadTextFile(filename: string, contents: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function normalizeGanttActivity(
  item: Partial<GanttActivity> & Pick<GanttActivity, "id" | "projectId" | "name" | "start" | "end">,
): GanttActivity {
  const start = item.start;
  const end = item.end;
  const parentCode = item.parentCode ?? "";
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
  return activities.filter((item) => item.parentCode === code);
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
): number {
  const children = childrenOf(activities, item.code);
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
  const total = pool.reduce((sum, child) => sum + rolledProgress(child, activities, reports), 0);
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
