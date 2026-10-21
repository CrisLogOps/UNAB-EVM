import { computeMetrics } from "./evm";
import {
  activityRequiresEvidence,
  childrenOf,
  reportableActivitiesForRole,
  rolledProgress,
} from "./schedule-csv";
import type {
  EvidenceStatus,
  GanttActivity,
  ProgressReport,
  Project,
  SCurvePoint,
  ScheduleElementKind,
  UserRole,
} from "./types";

export type ScheduleRunStatus = "pending" | "in_progress" | "done" | "late";

export const SCHEDULE_RUN_STATUS_LABELS: Record<ScheduleRunStatus, string> = {
  pending: "No iniciada",
  in_progress: "En curso",
  done: "Completada",
  late: "Atrasada",
};

export function scheduleRunStatus(
  row: { start: string; end: string; earnedPercent: number },
  asOf = new Date().toISOString().slice(0, 10),
): ScheduleRunStatus {
  if (row.earnedPercent >= 0.999) return "done";
  if (row.end && asOf > row.end) return "late";
  if (row.start && asOf < row.start) return "pending";
  return "in_progress";
}

export interface ActivityEvmRow {
  id: string;
  code: string;
  name: string;
  kind: ScheduleElementKind;
  stage: string;
  assigneeRole: UserRole | "";
  start: string;
  end: string;
  plannedPercent: number;
  earnedPercent: number;
  pv: number;
  ev: number;
  ac: number;
  evidence: EvidenceStatus | "none";
  requiresFieldEvidence: boolean;
  requiresEvidence: boolean;
  parentCode: string;
}

export interface LiveEvm {
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  physicalPercent: number;
  moneyMode: boolean;
  scoped: boolean;
  metrics: ReturnType<typeof computeMetrics>;
  series: SCurvePoint[];
  activities: ActivityEvmRow[];
}

function toDay(iso: string) {
  return new Date(`${iso}T00:00:00`).getTime();
}

function isoFromDay(ms: number) {
  const date = new Date(ms);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function durationDays(start: string, end: string) {
  const span = toDay(end) - toDay(start);
  return Math.max(1, Math.round(span / 86_400_000) + 1);
}

export function plannedPercent(start: string, end: string, asOf: string) {
  if (asOf < start) return 0;
  if (asOf >= end) return 1;
  const span = toDay(end) - toDay(start);
  if (span <= 0) return 1;
  return (toDay(asOf) - toDay(start)) / span;
}

export function leavesOf(activities: GanttActivity[]) {
  return activities.filter(
    (item) => item.elementKind !== "hito" && childrenOf(activities, item.code).length === 0,
  );
}

export function laboresForRole(activities: GanttActivity[], role: UserRole): GanttActivity[] {
  if (role === "pmo" || role === "owner" || role === "viewer") return activities;
  return reportableActivitiesForRole(activities, role);
}

function activityWeight(item: GanttActivity) {
  return item.budgetPv > 0 ? item.budgetPv : durationDays(item.start, item.end);
}

function latestEvidence(reports: ProgressReport[], taskId: string): EvidenceStatus | "none" {
  const last = [...reports].reverse().find((item) => item.taskId === taskId);
  return last?.evidenceStatus ?? "none";
}

function activityAc(reports: ProgressReport[], taskId: string) {
  return reports.filter((item) => item.taskId === taskId).reduce((sum, item) => sum + (item.actualCost || 0), 0);
}

function extraAcAmount(
  extraAc: { period: string; taskId: string; amount: number }[],
  until?: string,
  taskId?: string,
) {
  return extraAc.reduce((sum, row) => {
    if (until && row.period > until) return sum;
    if (taskId !== undefined && row.taskId !== taskId) return sum;
    return sum + (row.amount || 0);
  }, 0);
}

function enumeratePeriods(start: string, end: string, asOf: string) {
  const min = toDay(start);
  const max = Math.max(toDay(end), toDay(asOf));
  const days = Math.max(1, Math.round((max - min) / 86_400_000));
  const step = days > 90 ? 14 : days > 21 ? 7 : 1;
  const out: string[] = [];
  for (let t = min; t <= max; t += step * 86_400_000) {
    out.push(isoFromDay(t));
  }
  if (!out.length) return [asOf];
  if (out[out.length - 1] < isoFromDay(max)) out.push(isoFromDay(max));
  if (asOf >= start && !out.includes(asOf)) {
    out.push(asOf);
    out.sort();
  }
  return out;
}

export function computeLiveEvm(
  project: Project,
  activities: GanttActivity[],
  reports: ProgressReport[],
  role: UserRole,
  asOf = new Date().toISOString().slice(0, 10),
  held?: Set<string>,
  extraAc: { period: string; taskId: string; amount: number }[] = [],
): LiveEvm {
  const scoped = role === "field" || role === "subcontractor";
  const visible = laboresForRole(activities, role);
  const pool = scoped ? visible : leavesOf(activities);
  const moneyMode = pool.some((item) => item.budgetPv > 0) || (!scoped && project.bac > 0);
  const projectReports = reports.filter((item) => item.projectId === project.id);

  const rows: ActivityEvmRow[] = visible.map((item) => {
    const planned = plannedPercent(item.start, item.end, asOf);
    const earned = rolledProgress(item, activities, projectReports, new Set(), held) / 100;
    const weight = activityWeight(item);
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      kind: item.elementKind,
      stage: item.stage || "General",
      assigneeRole: item.assigneeRole,
      start: item.start,
      end: item.end,
      plannedPercent: planned,
      earnedPercent: earned,
      pv: weight * planned,
      ev: weight * earned,
      ac: activityAc(projectReports, item.id) + extraAcAmount(extraAc, undefined, item.id),
      evidence: latestEvidence(projectReports, item.id),
      requiresFieldEvidence: item.requiresFieldEvidence,
      requiresEvidence: activityRequiresEvidence(item, activities),
      parentCode: item.parentCode,
    };
  });

  const bac = !scoped && project.bac > 0 ? project.bac : pool.reduce((sum, item) => sum + activityWeight(item), 0);
  const pv = pool.reduce((sum, item) => sum + activityWeight(item) * plannedPercent(item.start, item.end, asOf), 0);
  const ev = pool.reduce(
      (sum, item) => sum + activityWeight(item) * (rolledProgress(item, activities, projectReports, new Set(), held) / 100),
    0,
  );
  const ac = pool.reduce((sum, item) => sum + activityAc(projectReports, item.id), 0) + extraAcAmount(extraAc);

  const rangeStart = pool.reduce((min, item) => (item.start < min ? item.start : min), project.startDate || asOf);
  const rangeEnd = pool.reduce((max, item) => (item.end > max ? item.end : max), project.finishDate || asOf);
  const periods = pool.length ? enumeratePeriods(rangeStart, rangeEnd, asOf) : [asOf];

  const series: SCurvePoint[] = periods.map((period, index) => {
    const pointPv = pool.reduce(
      (sum, item) => sum + activityWeight(item) * plannedPercent(item.start, item.end, period),
      0,
    );
    const pointAc =
      projectReports
        .filter((report) => report.period <= period && pool.some((item) => item.id === report.taskId))
        .reduce((sum, report) => sum + (report.actualCost || 0), 0) + extraAcAmount(extraAc, period);
    const ratio = pv > 0 ? Math.min(1, pointPv / pv) : 0;
    return {
      period: period.slice(5),
      at: index,
      pv: pointPv,
      ev: period > asOf ? ev : ev * ratio,
      ac: pointAc,
    };
  });

  const pvCurve = series.map((item) => item.pv);
  const atIndex = series.findIndex((_, index) => (periods[index] ?? "") >= asOf);
  const at = Math.max(1, atIndex < 0 ? series.length : atIndex + 1);
  const physicalPercent = bac > 0 ? ev / bac : 0;
  const pendingEvidence = rows.some(
    (item) => item.requiresEvidence && item.evidence !== "validated" && item.evidence !== "none",
  );

  const metrics = computeMetrics({
    projectId: project.id,
    period: asOf,
    bac: bac || 1,
    pv,
    ac,
    physicalPercent,
    evidenceStatus: ev > 0 || !pendingEvidence ? "validated" : "uploaded",
    pvCurve: pvCurve.some((item) => item > 0) ? pvCurve : [0, Math.max(bac, 1)],
    at,
  });

  return {
    bac,
    pv,
    ev,
    ac,
    physicalPercent,
    moneyMode,
    scoped,
    metrics: {
      ...metrics,
      bac,
      pv,
      ev,
      ac,
      evidenceLocked: pendingEvidence,
    },
    series,
    activities: rows,
  };
}

export interface WeekReading {
  date: string;
  period: string;
  pv: number;
  ev: number | null;
  ac: number | null;
  bac: number;
  physicalPercent: number | null;
  plannedPercent: number;
  current: boolean;
}

function addDays(iso: string, days: number) {
  return isoFromDay(toDay(iso) + days * 86_400_000);
}

function formatWeekLabel(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}-${month}-${year.slice(2)}`;
}

function earnedRatioAsOf(
  item: GanttActivity,
  activities: GanttActivity[],
  reports: ProgressReport[],
  asOf: string,
  seen: Set<string>,
): number {
  const key = item.id || item.code;
  if (key && seen.has(key)) return 0;
  if (key) seen.add(key);
  const children = childrenOf(activities, item.code).filter((child) => (child.id || child.code) !== key);
  if (!children.length) {
    let ratio = 0;
    for (const report of reports) {
      if (report.taskId !== item.id || report.period > asOf) continue;
      if (report.evidenceStatus !== "validated") continue;
      if (report.closure === "prerequisito" || report.closure === "no_conforme") continue;
      ratio = Math.max(ratio, report.physicalPercent || 0);
    }
    return ratio;
  }
  const measurable = children.filter((child) => child.elementKind !== "hito" || child.requiresFieldEvidence);
  const leaves = measurable.filter((child) => !childrenOf(activities, child.code).length);
  const pool = leaves.length ? leaves : measurable.length ? measurable : children;
  const nextSeen = new Set(seen);
  const total = pool.reduce(
    (sum, child) => sum + earnedRatioAsOf(child, activities, reports, asOf, nextSeen),
    0,
  );
  return pool.length ? total / pool.length : 0;
}

export function weekCutDates(start: string, finish: string, asOf: string, extra: string[] = []) {
  const from = start || asOf;
  const dates: string[] = [];
  let cursor = from;
  let guard = 0;
  while (cursor && cursor <= asOf && guard < 160) {
    dates.push(cursor);
    cursor = addDays(cursor, 7);
    guard += 1;
  }
  if (asOf && !dates.includes(asOf)) dates.push(asOf);
  for (const date of extra) {
    if (!date || dates.includes(date)) continue;
    if (finish && date > finish && date > asOf) continue;
    dates.push(date);
  }
  return dates.filter(Boolean).sort();
}

export function projectReadingAt(
  project: Project,
  activities: GanttActivity[],
  reports: ProgressReport[],
  role: UserRole,
  asOf: string,
  today = new Date().toISOString().slice(0, 10),
  extraAc: { period: string; taskId: string; amount: number }[] = [],
) {
  const scoped = role === "field" || role === "subcontractor";
  const visible = laboresForRole(activities, role);
  const pool = scoped ? visible : leavesOf(activities);
  const projectReports = reports.filter((item) => item.projectId === project.id);
  const live = asOf >= today;
  const bac = !scoped && project.bac > 0 ? project.bac : pool.reduce((sum, item) => sum + activityWeight(item), 0);
  const pv = pool.reduce((sum, item) => sum + activityWeight(item) * plannedPercent(item.start, item.end, asOf), 0);
  const ev = pool.reduce((sum, item) => {
    const ratio = live
      ? rolledProgress(item, activities, projectReports, new Set()) / 100
      : earnedRatioAsOf(item, activities, projectReports, asOf, new Set());
    return sum + activityWeight(item) * ratio;
  }, 0);
  const ac = live
    ? pool.reduce((sum, item) => sum + activityAc(projectReports, item.id), 0) + extraAcAmount(extraAc)
    : projectReports
        .filter((report) => report.period <= asOf && pool.some((item) => item.id === report.taskId))
        .reduce((sum, report) => sum + (report.actualCost || 0), 0) + extraAcAmount(extraAc, asOf);
  return { bac, pv, ev, ac, physicalPercent: bac > 0 ? ev / bac : 0 };
}

export function weeklyReadings(
  project: Project,
  activities: GanttActivity[],
  reports: ProgressReport[],
  role: UserRole,
  today = new Date().toISOString().slice(0, 10),
  extraAc: { period: string; taskId: string; amount: number }[] = [],
  extraDates: string[] = [],
): WeekReading[] {
  const dates = weekCutDates(project.startDate, project.finishDate, today, extraDates);
  return dates.map((date) => {
    const reading = projectReadingAt(project, activities, reports, role, date, today, extraAc);
    const future = date > today;
    return {
      date,
      period: formatWeekLabel(date),
      pv: reading.pv,
      ev: future ? null : reading.ev,
      ac: future ? null : reading.ac,
      bac: reading.bac,
      physicalPercent: future || reading.bac <= 0 ? null : reading.ev / reading.bac,
      plannedPercent: reading.bac > 0 ? reading.pv / reading.bac : 0,
      current: date === today,
    };
  });
}
