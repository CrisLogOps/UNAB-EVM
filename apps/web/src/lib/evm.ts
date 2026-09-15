import { ALERT_THRESHOLDS } from "./constants";
import type { AlertStatus, EvidenceStatus, EvmMetrics } from "./types";

function safeDiv(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function earnedValue(
  physicalPercent: number,
  bac: number,
  evidenceStatus: EvidenceStatus,
): number {
  if (evidenceStatus !== "validated") return 0;
  return physicalPercent * bac;
}

function statusCpi(cpi: number): AlertStatus {
  if (cpi >= ALERT_THRESHOLDS.cpiGreenMin) return "green";
  if (cpi >= ALERT_THRESHOLDS.cpiYellowMin) return "yellow";
  return "red";
}

function statusSpit(spit: number): AlertStatus {
  if (spit >= ALERT_THRESHOLDS.spitGreenMin) return "green";
  if (spit >= ALERT_THRESHOLDS.spitYellowMin) return "yellow";
  return "red";
}

function statusTcpi(tcpi: number): AlertStatus {
  if (tcpi <= ALERT_THRESHOLDS.tcpiGreenMax) return "green";
  if (tcpi <= ALERT_THRESHOLDS.tcpiYellowMax) return "yellow";
  return "red";
}

function combine(...statuses: AlertStatus[]): AlertStatus {
  if (statuses.includes("red")) return "red";
  if (statuses.includes("yellow")) return "yellow";
  return "green";
}

export function computeEarnedSchedule(pvCurve: number[], ev: number, at: number) {
  if (!pvCurve.length) throw new Error("pvCurve vacía");
  if (at <= 0) throw new Error("AT debe ser > 0");

  if (ev <= pvCurve[0]) {
    const i = pvCurve[0] ? ev / pvCurve[0] : 0;
    const es = pvCurve[0] ? i : 0;
    return { es, svt: es - at, spit: es / at, c: 0, i };
  }

  let c = 0;
  for (let idx = 0; idx < pvCurve.length; idx += 1) {
    if (pvCurve[idx] <= ev) c = idx;
    else break;
  }

  let i = 0;
  if (ev >= pvCurve[pvCurve.length - 1]) {
    c = pvCurve.length - 1;
  } else if (c + 1 < pvCurve.length) {
    const delta = pvCurve[c + 1] - pvCurve[c];
    i = delta ? (ev - pvCurve[c]) / delta : 0;
  }

  const es = c + i;
  return { es, svt: es - at, spit: es / at, c, i };
}

export function computeMetrics(input: {
  projectId: string;
  period: string;
  bac: number;
  pv: number;
  ac: number;
  physicalPercent: number;
  evidenceStatus: EvidenceStatus;
  pvCurve: number[];
  at: number;
}): EvmMetrics {
  const ev = earnedValue(input.physicalPercent, input.bac, input.evidenceStatus);
  const cpi = safeDiv(ev, input.ac);
  const spi = safeDiv(ev, input.pv);
  const cv = ev - input.ac;
  const sv = ev - input.pv;
  const eac = cpi > 0 ? safeDiv(input.bac, cpi) : 0;
  const vac = cpi > 0 ? input.bac - eac : 0;
  const tcpi = safeDiv(input.bac - ev, input.bac - input.ac);
  const evidenceLocked = ev === 0 && input.physicalPercent > 0;
  const schedule = computeEarnedSchedule(input.pvCurve, ev, input.at);
  const alerts = {
    cpi: statusCpi(cpi),
    spit: statusSpit(schedule.spit),
    tcpi: statusTcpi(tcpi),
    overall: evidenceLocked
      ? ("red" as const)
      : combine(statusCpi(cpi), statusSpit(schedule.spit), statusTcpi(tcpi)),
  };

  return {
    projectId: input.projectId,
    period: input.period,
    at: input.at,
    bac: input.bac,
    pv: input.pv,
    ev,
    ac: input.ac,
    cpi,
    spi,
    cv,
    sv,
    es: schedule.es,
    svt: schedule.svt,
    spit: schedule.spit,
    eac,
    vac,
    tcpi,
    evidenceLocked,
    alerts,
  };
}

export function formatClp(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatUf(clp: number, ufClp: number): string {
  if (!ufClp) return "—";
  return `${(clp / ufClp).toFixed(2)} UF`;
}

export function formatUsd(clp: number, usdClp: number): string {
  if (!usdClp) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(clp / usdClp);
}

export function formatRatio(value: number): string {
  return value.toFixed(2);
}
