import type {
  Client,
  GanttActivity,
  ProgressReport,
  Project,
  ProjectKickoff,
  Tenant,
  TenantUser,
  WorkBookBoardStatus,
  WorkBookEntry,
  WorkBookKind,
  WorkBookMeta,
  WorkBookSafetyLevel,
  WorkBookSource,
  WorkBookThirdPartyKind,
} from "./types";
import { ROLE_LABELS } from "./constants";

export const MIN_WORKBOOK_BODY = 20;

export const WORK_BOOK_KINDS: {
  id: WorkBookKind;
  label: string;
  short: string;
  hint: string;
}[] = [
  {
    id: "ito",
    label: "Instrucción del ITO",
    short: "ITO",
    hint: "Órdenes, plazos y observaciones de la Inspección Técnica de Obra. Quedan para validar con el mandante.",
  },
  {
    id: "progress",
    label: "Anotación diaria de avance",
    short: "Avance",
    hint: "Parte del día: qué se ejecutó, frente de trabajo y respaldo. También entra lo registrado en Avance.",
  },
  {
    id: "safety",
    label: "Seguridad y accidentes",
    short: "Seguridad",
    hint: "Observaciones de faena, incidentes y accidentes. Es el expediente interno; no sustituye el aviso a la mutual o a la DT.",
  },
  {
    id: "third_party",
    label: "Reclamo o interferencia de terceros",
    short: "Terceros",
    hint: "Reclamos, interferencias de redes, vecinos u otros contratistas que afecten el avance o el contrato.",
  },
];

export const SAFETY_LEVELS: { id: Exclude<WorkBookSafetyLevel, "">; label: string }[] = [
  { id: "observation", label: "Observación de seguridad" },
  { id: "incident", label: "Incidente" },
  { id: "accident", label: "Accidente" },
];

export const THIRD_PARTY_KINDS: { id: Exclude<WorkBookThirdPartyKind, "">; label: string }[] = [
  { id: "claim", label: "Reclamo" },
  { id: "interference", label: "Interferencia" },
];

export const WORK_BOOK_BOARD_COLUMNS: {
  id: WorkBookBoardStatus;
  label: string;
  hint: string;
}[] = [
  { id: "open", label: "Por atender", hint: "Entradas y bloqueos sin resolver" },
  { id: "doing", label: "En faena", hint: "Lo que estás ejecutando ahora" },
  { id: "closed", label: "Cerrado", hint: "Autocontrol: lo das por cumplido" },
];

export function defaultBoardStatus(kind: WorkBookKind, source: WorkBookSource = "manual"): WorkBookBoardStatus {
  if (kind === "progress" || source === "progress") return "doing";
  return "open";
}

export function isWorkBookBlocker(entry: Pick<WorkBookEntry, "kind" | "safetyLevel" | "thirdPartyKind" | "boardStatus">) {
  if (entry.boardStatus === "closed") return false;
  if (entry.kind === "ito") return true;
  if (entry.kind === "safety" && (entry.safetyLevel === "observation" || entry.safetyLevel === "incident")) return true;
  if (entry.kind === "third_party" && entry.thirdPartyKind === "interference") return true;
  return false;
}

export const WEATHER_OPTIONS = [
  { id: "", label: "No indica" },
  { id: "despejado", label: "Despejado" },
  { id: "nublado", label: "Nublado" },
  { id: "lluvia", label: "Lluvia" },
  { id: "viento", label: "Viento" },
  { id: "helada", label: "Helada" },
];

const KIND_IDS = new Set<WorkBookKind>(WORK_BOOK_KINDS.map((item) => item.id));

export function workBookKindLabel(kind: WorkBookKind) {
  return WORK_BOOK_KINDS.find((item) => item.id === kind)?.label ?? kind;
}

export function workBookKindMeta(kind: WorkBookKind) {
  return WORK_BOOK_KINDS.find((item) => item.id === kind) ?? WORK_BOOK_KINDS[1];
}

export function folioLabel(folio: number) {
  return `N° ${String(folio).padStart(3, "0")}`;
}

export function nextFolio(entries: WorkBookEntry[], projectId: string) {
  const max = entries.reduce((acc, item) => {
    if (item.projectId !== projectId) return acc;
    return Math.max(acc, item.folio);
  }, 0);
  return max + 1;
}

export function emptyWorkBookEntry(projectId: string, kind: WorkBookKind, folio: number, userId: string): WorkBookEntry {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `wb-${Date.now()}-${folio}`,
    projectId,
    folio,
    kind,
    occurredOn: today,
    occurredTime: new Date().toTimeString().slice(0, 5),
    recordedAt: new Date().toISOString(),
    recordedBy: userId,
    body: "",
    evidenceFileName: "",
    evidenceFileType: "",
    evidenceFileSize: 0,
    source: "manual",
    sourceReportId: "",
    issuer: "",
    reference: "",
    dueOn: "",
    safetyLevel: "",
    location: "",
    weather: "",
    thirdPartyKind: "",
    thirdPartyName: "",
    activityId: "",
    boardStatus: defaultBoardStatus(kind),
  };
}

export function normalizeWorkBookEntry(raw: Partial<WorkBookEntry> | null | undefined, fallback?: WorkBookEntry): WorkBookEntry {
  const kind = KIND_IDS.has(raw?.kind as WorkBookKind) ? (raw?.kind as WorkBookKind) : fallback?.kind ?? "progress";
  return {
    id: raw?.id || fallback?.id || `wb-${Date.now()}`,
    projectId: raw?.projectId || fallback?.projectId || "",
    folio: Number(raw?.folio) || fallback?.folio || 1,
    kind,
    occurredOn: raw?.occurredOn || fallback?.occurredOn || new Date().toISOString().slice(0, 10),
    occurredTime: raw?.occurredTime || fallback?.occurredTime || "",
    recordedAt: raw?.recordedAt || fallback?.recordedAt || new Date().toISOString(),
    recordedBy: raw?.recordedBy || fallback?.recordedBy || "",
    body: raw?.body ?? fallback?.body ?? "",
    evidenceFileName: raw?.evidenceFileName ?? fallback?.evidenceFileName ?? "",
    evidenceFileType: raw?.evidenceFileType ?? fallback?.evidenceFileType ?? "",
    evidenceFileSize: raw?.evidenceFileSize ?? fallback?.evidenceFileSize ?? 0,
    source: raw?.source === "progress" ? "progress" : "manual",
    sourceReportId: raw?.sourceReportId ?? fallback?.sourceReportId ?? "",
    issuer: raw?.issuer ?? fallback?.issuer ?? "",
    reference: raw?.reference ?? fallback?.reference ?? "",
    dueOn: raw?.dueOn ?? fallback?.dueOn ?? "",
    safetyLevel: raw?.safetyLevel ?? fallback?.safetyLevel ?? "",
    location: raw?.location ?? fallback?.location ?? "",
    weather: raw?.weather ?? fallback?.weather ?? "",
    thirdPartyKind: raw?.thirdPartyKind ?? fallback?.thirdPartyKind ?? "",
    thirdPartyName: raw?.thirdPartyName ?? fallback?.thirdPartyName ?? "",
    activityId: raw?.activityId ?? fallback?.activityId ?? "",
    boardStatus:
      raw?.boardStatus === "open" || raw?.boardStatus === "doing" || raw?.boardStatus === "closed"
        ? raw.boardStatus
        : fallback?.boardStatus ?? defaultBoardStatus(kind, raw?.source === "progress" ? "progress" : "manual"),
  };
}

export function workBookBodyOk(body: string) {
  return body.trim().length >= MIN_WORKBOOK_BODY;
}

export function workBookEntryReady(entry: Pick<WorkBookEntry, "kind" | "body" | "issuer" | "safetyLevel" | "thirdPartyKind">) {
  if (!workBookBodyOk(entry.body)) return false;
  if (entry.kind === "ito") return Boolean(entry.issuer.trim());
  if (entry.kind === "safety") return Boolean(entry.safetyLevel);
  if (entry.kind === "third_party") return Boolean(entry.thirdPartyKind);
  return true;
}

export function composeProgressAnnotation(activity: GanttActivity | undefined, report: ProgressReport) {
  const name = activity?.code ? `${activity.code} · ${activity.name}` : activity?.name || "partida del cronograma";
  const percent = Math.round(report.physicalPercent * 100);
  const note = report.note?.trim();
  const evidence = report.evidenceName ? ` Evidencia: ${report.evidenceName}.` : "";
  if (note) return `${note}${note.endsWith(".") ? "" : "."} ${name}: ${percent}%.${evidence}`.trim();
  return `Anotación diaria de avance en ${name}: ${percent}% físico.${evidence}`;
}

export function entryFromProgressReport(
  report: ProgressReport,
  activity: GanttActivity | undefined,
  folio: number,
): WorkBookEntry {
  return {
    id: `wb-pr-${report.id}`,
    projectId: report.projectId,
    folio,
    kind: "progress",
    occurredOn: report.period || new Date().toISOString().slice(0, 10),
    occurredTime: "",
    recordedAt: report.period ? `${report.period}T12:00:00.000Z` : new Date().toISOString(),
    recordedBy: report.reportedBy,
    body: composeProgressAnnotation(activity, report),
    evidenceFileName: report.evidenceName || "",
    evidenceFileType: "",
    evidenceFileSize: 0,
    source: "progress",
    sourceReportId: report.id,
    issuer: "",
    reference: activity?.code || "",
    dueOn: "",
    safetyLevel: "",
    location: "",
    weather: "",
    thirdPartyKind: "",
    thirdPartyName: "",
    activityId: report.taskId,
    boardStatus: "doing",
  };
}

export function backfillProgressIntoWorkBook(
  reports: ProgressReport[],
  entries: WorkBookEntry[],
  activities: GanttActivity[],
): WorkBookEntry[] {
  const linked = new Set(entries.map((item) => item.sourceReportId).filter(Boolean));
  const extra: WorkBookEntry[] = [];
  reports.forEach((report) => {
    if (linked.has(report.id)) return;
    const folio = nextFolio([...entries, ...extra], report.projectId);
    extra.push(
      entryFromProgressReport(
        report,
        activities.find((item) => item.id === report.taskId),
        folio,
      ),
    );
  });
  return extra;
}

export function workBookCounts(entries: WorkBookEntry[]) {
  return WORK_BOOK_KINDS.reduce(
    (acc, kind) => {
      acc[kind.id] = entries.filter((item) => item.kind === kind.id).length;
      return acc;
    },
    { ito: 0, progress: 0, safety: 0, third_party: 0 } as Record<WorkBookKind, number>,
  );
}

export function workBookBoardCounts(entries: WorkBookEntry[]) {
  return WORK_BOOK_BOARD_COLUMNS.reduce(
    (acc, column) => {
      acc[column.id] = entries.filter((item) => item.boardStatus === column.id).length;
      return acc;
    },
    { open: 0, doing: 0, closed: 0 } as Record<WorkBookBoardStatus, number>,
  );
}

export function emptyWorkBookMeta(projectId: string, contractNumber = ""): WorkBookMeta {
  return {
    projectId,
    location: "",
    contractNumber,
    itoName: "",
    contractorRep: "",
  };
}

export function normalizeWorkBookMeta(raw: Partial<WorkBookMeta> | null | undefined, projectId: string, contractNumber = ""): WorkBookMeta {
  const base = emptyWorkBookMeta(projectId, contractNumber);
  return {
    projectId: raw?.projectId || projectId,
    location: raw?.location ?? base.location,
    contractNumber: raw?.contractNumber || contractNumber || base.contractNumber,
    itoName: raw?.itoName ?? base.itoName,
    contractorRep: raw?.contractorRep ?? base.contractorRep,
  };
}

export function formatWorkBookDay(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
}

export function weatherLabel(id: string) {
  return WEATHER_OPTIONS.find((item) => item.id === id)?.label ?? (id || "—");
}

export function folioExtraLine(item: WorkBookEntry) {
  const parts: string[] = [];
  if (item.kind === "ito") {
    if (item.issuer) parts.push(`ITO: ${item.issuer}`);
    if (item.reference) parts.push(`Instrucción ${item.reference}`);
    if (item.dueOn) parts.push(`Plazo ${formatWorkBookDay(item.dueOn)}`);
  }
  if (item.kind === "safety") {
    const safety = SAFETY_LEVELS.find((entry) => entry.id === item.safetyLevel)?.label;
    if (safety) parts.push(safety);
  }
  if (item.kind === "third_party") {
    const third = THIRD_PARTY_KINDS.find((entry) => entry.id === item.thirdPartyKind)?.label;
    if (third) parts.push(third);
    if (item.thirdPartyName) parts.push(item.thirdPartyName);
  }
  return parts.join(" · ");
}

export interface WorkBookDocumentHeader {
  obra: string;
  code: string;
  contractNumber: string;
  mandante: string;
  mandanteRut: string;
  contratista: string;
  contratistaRut: string;
  location: string;
  itoName: string;
  contractorRep: string;
  startDate: string;
  finishDate: string;
  contractType: string;
  issuedAt: string;
  folioFrom: number;
  folioTo: number;
  folioCount: number;
}

export interface WorkBookDocumentFolio {
  folio: number;
  occurredOn: string;
  occurredTime: string;
  kindLabel: string;
  weather: string;
  location: string;
  body: string;
  extra: string;
  recordedBy: string;
  recordedRole: string;
  evidenceFileName: string;
}

export interface WorkBookDocumentModel {
  header: WorkBookDocumentHeader;
  folios: WorkBookDocumentFolio[];
  gaps: string[];
}

export function workBookHeaderGaps(header: WorkBookDocumentHeader) {
  const gaps: string[] = [];
  if (!header.location.trim()) gaps.push("ubicación de la faena");
  if (!header.itoName.trim()) gaps.push("ITO titular");
  if (!header.contractorRep.trim()) gaps.push("representante del contratista");
  if (!header.mandante.trim()) gaps.push("mandante");
  if (!header.contratista.trim()) gaps.push("contratista");
  return gaps;
}

export function buildWorkBookDocument(input: {
  project: Project;
  tenant: Tenant;
  client?: Client;
  kickoff?: ProjectKickoff;
  meta: WorkBookMeta;
  entries: WorkBookEntry[];
  users: TenantUser[];
  contractorRepFallback: string;
}): WorkBookDocumentModel {
  const ordered = [...input.entries]
    .filter((item) => item.projectId === input.project.id)
    .sort((a, b) => a.folio - b.folio);
  const header: WorkBookDocumentHeader = {
    obra: input.project.name,
    code: input.project.code,
    contractNumber: input.meta.contractNumber.trim() || input.project.code,
    mandante: input.client?.name || "",
    mandanteRut: input.client?.rut || "",
    contratista: input.tenant.name,
    contratistaRut: input.tenant.rut,
    location: input.meta.location,
    itoName: input.meta.itoName,
    contractorRep: input.meta.contractorRep.trim() || input.contractorRepFallback,
    startDate: input.kickoff?.plannedStartDate || input.project.startDate,
    finishDate: input.kickoff?.plannedFinishDate || input.project.finishDate,
    contractType: input.kickoff?.contractType || "",
    issuedAt: new Date().toISOString().slice(0, 10),
    folioFrom: ordered[0]?.folio ?? 0,
    folioTo: ordered[ordered.length - 1]?.folio ?? 0,
    folioCount: ordered.length,
  };
  const folios = ordered.map((item) => {
    const who = input.users.find((user) => user.id === item.recordedBy);
    return {
      folio: item.folio,
      occurredOn: item.occurredOn,
      occurredTime: item.occurredTime,
      kindLabel: workBookKindLabel(item.kind),
      weather: weatherLabel(item.weather),
      location: item.location,
      body: item.body,
      extra: folioExtraLine(item),
      recordedBy: who?.name || "—",
      recordedRole: ROLE_LABELS[who?.role ?? "field"],
      evidenceFileName: item.evidenceFileName,
    };
  });
  return { header, folios, gaps: workBookHeaderGaps(header) };
}

export function workBookPdfFileName(header: WorkBookDocumentHeader) {
  const code = (header.code || header.contractNumber || "obra").replace(/[^\w.-]+/g, "-");
  return `Libro-de-obra-${code}-${header.issuedAt}.pdf`;
}
