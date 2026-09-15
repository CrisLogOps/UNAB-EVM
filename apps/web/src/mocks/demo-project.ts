import { computeMetrics } from "@/lib/evm";
import type { Project, ProgressReport, Task, Tenant } from "@/lib/types";

export const demoTenant: Tenant = {
  id: "tenant-demo",
  name: "Constructora Andes Sur",
  slug: "andes-sur",
  createdAt: "2025-11-01",
  rut: "76.123.456-7",
  activityType: "obras-civiles",
  companySize: "medium",
};

export const demoProject: Project = {
  id: "prj-ruta5-talca",
  tenantId: demoTenant.id,
  name: "Mejoramiento Ruta 5 — Tramo Talca",
  code: "R5-TALCA-01",
  bac: 500_000_000,
  startDate: "2026-01-06",
  finishDate: "2026-06-30",
  baselineStatus: "FROZEN",
  baselineVersion: "v1.0",
  currency: "CLP",
  status: "active",
  ufClp: 39_450,
  usdClp: 940,
  proposedBac: 500_000_000,
  counterBac: null,
  budgetNote: "Presupuesto Meta v1.0 ya validado.",
  clientId: "",
  kickoffPhase: "client_done",
};

export const demoTasks: Task[] = [
  {
    id: "t-exc",
    projectId: demoProject.id,
    activityCode: "1.1",
    name: "Excavación y movimiento de tierras",
    plannedStart: "2026-01-06",
    plannedFinish: "2026-02-28",
    budgetPv: 120_000_000,
    weight: 0.24,
    unit: "m³",
    qty: 8_000,
  },
  {
    id: "t-base",
    projectId: demoProject.id,
    activityCode: "1.2",
    name: "Base granular y compactación",
    plannedStart: "2026-02-15",
    plannedFinish: "2026-04-15",
    budgetPv: 180_000_000,
    weight: 0.36,
    unit: "m²",
    qty: 12_000,
  },
  {
    id: "t-pav",
    projectId: demoProject.id,
    activityCode: "1.3",
    name: "Pavimento asfáltico",
    plannedStart: "2026-04-01",
    plannedFinish: "2026-06-15",
    budgetPv: 200_000_000,
    weight: 0.4,
    unit: "m²",
    qty: 11_500,
  },
];

export const PV_CURVE = [0, 80_000_000, 160_000_000, 240_000_000, 320_000_000, 400_000_000, 500_000_000];

export const demoReports: ProgressReport[] = [
  {
    id: "cut-s1",
    projectId: demoProject.id,
    taskId: "t-exc",
    reportedBy: "field-01",
    period: "2026-02-03",
    physicalPercent: 0.32,
    actualCost: 152_000_000,
    evidenceId: "ev-s1",
    evidenceName: "foto-s1.jpg",
    evidenceStatus: "validated",
    clientEventId: "evt-s1",
  },
  {
    id: "cut-s2",
    projectId: demoProject.id,
    taskId: "t-base",
    reportedBy: "field-01",
    period: "2026-03-03",
    physicalPercent: 0.46,
    actualCost: 245_000_000,
    evidenceId: "ev-s2",
    evidenceName: "foto-s2.jpg",
    evidenceStatus: "validated",
    clientEventId: "evt-s2",
  },
  {
    id: "cut-s3",
    projectId: demoProject.id,
    taskId: "t-pav",
    reportedBy: "field-01",
    period: "2026-04-07",
    physicalPercent: 0.55,
    actualCost: 300_000_000,
    evidenceId: "ev-s3",
    evidenceName: "foto-s3.jpg",
    evidenceStatus: "uploaded",
    clientEventId: "evt-s3",
  },
];

const cutInputs = [
  { report: demoReports[0], pv: 160_000_000, at: 2 },
  { report: demoReports[1], pv: 240_000_000, at: 3 },
  { report: demoReports[2], pv: 320_000_000, at: 4 },
];

export const demoMetrics = cutInputs.map(({ report, pv, at }) =>
  computeMetrics({
    projectId: demoProject.id,
    period: report.period,
    bac: demoProject.bac,
    pv,
    ac: report.actualCost,
    physicalPercent: report.physicalPercent,
    evidenceStatus: report.evidenceStatus,
    pvCurve: PV_CURVE,
    at,
  }),
);

export const latestMetrics = demoMetrics[demoMetrics.length - 1];

export const sCurveSeries = PV_CURVE.map((pv, at) => {
  const exact = cutInputs.findIndex((item) => item.at === at);
  const previous = [...cutInputs].reverse().find((item) => item.at <= at);
  const metrics =
    exact >= 0
      ? demoMetrics[exact]
      : previous
        ? demoMetrics[cutInputs.indexOf(previous)]
        : undefined;
  return {
    period: at === 0 ? "Inicio" : `S${at}`,
    at,
    pv,
    ev: metrics?.ev ?? 0,
    ac: metrics?.ac ?? 0,
  };
});
