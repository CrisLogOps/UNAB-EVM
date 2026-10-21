import type { PaymentCadence, PaymentCut } from "./types";

export const PAYMENT_CADENCES: {
  id: PaymentCadence;
  label: string;
  detail: string;
  days: number[];
}[] = [
  {
    id: "month_early",
    label: "Primeros días del mes",
    detail: "Un estado el día 5, dentro de la ventana del 1 al 5.",
    days: [5],
  },
  {
    id: "month_late",
    label: "Días 25 al 28",
    detail: "Un estado el día 28, dentro de la ventana del 25 al 28. No usa el 29 ni el 30.",
    days: [28],
  },
  {
    id: "quincena",
    label: "Quincenas",
    detail: "El día 15 y el día 28. La segunda quincena cierra el 28 para que febrero también calce.",
    days: [15, 28],
  },
];

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function paymentCadenceById(id: PaymentCadence) {
  return PAYMENT_CADENCES.find((item) => item.id === id) ?? PAYMENT_CADENCES[0];
}

export function datesForCadence(start: string, finish: string, cadence: PaymentCadence) {
  if (!start || !finish || finish < start) return [];
  const days = paymentCadenceById(cadence).days;
  const [startYear, startMonth] = start.split("-").map(Number);
  const [finishYear, finishMonth] = finish.split("-").map(Number);
  const dates: string[] = [];
  let year = startYear;
  let month = startMonth;
  while (year < finishYear || (year === finishYear && month <= finishMonth)) {
    for (const day of days) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (date >= start && date <= finish) dates.push(date);
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    if (dates.length > 400) break;
  }
  return dates;
}

export function paymentCutLabel(cadence: PaymentCadence, dueDate: string) {
  const day = Number(dueDate.slice(8, 10));
  const month = MONTHS[Number(dueDate.slice(5, 7)) - 1] ?? "";
  const year = dueDate.slice(0, 4);
  if (cadence === "quincena") return `Quincena día ${day} · ${month} ${year}`;
  if (cadence === "month_early") return `Día 5 · ${month} ${year}`;
  return `Día 28 · ${month} ${year}`;
}

export function replaceOpenCadenceCuts(
  current: PaymentCut[],
  projectId: string,
  cadence: PaymentCadence,
  dates: string[],
  origin: PaymentCut["origin"],
) {
  const kept = current.filter((item) => {
    if (item.projectId !== projectId) return true;
    if (item.frozenAt) return true;
    return !item.rule;
  });
  const next = [...kept];
  for (const dueDate of dates) {
    if (next.some((item) => item.projectId === projectId && item.dueDate === dueDate)) continue;
    next.push({
      id: `pay-${projectId}-${dueDate}`,
      projectId,
      dueDate,
      label: paymentCutLabel(cadence, dueDate),
      origin,
      rule: cadence,
      note: "",
      frozenAt: null,
      pv: null,
      ev: null,
      ac: null,
      physicalPercent: null,
    });
  }
  return next;
}

export function normalizePaymentCut(raw: Partial<PaymentCut> | null | undefined): PaymentCut | null {
  if (!raw?.projectId || !raw.dueDate) return null;
  return {
    id: raw.id || `pay-${raw.projectId}-${raw.dueDate}`,
    projectId: raw.projectId,
    dueDate: raw.dueDate,
    label: raw.label?.trim() || "Estado de pago",
    origin: raw.origin === "kickoff" ? "kickoff" : "admin",
    rule: raw.rule === "month_early" || raw.rule === "month_late" || raw.rule === "quincena" ? raw.rule : "",
    note: raw.note ?? "",
    frozenAt: raw.frozenAt ?? null,
    pv: typeof raw.pv === "number" ? raw.pv : null,
    ev: typeof raw.ev === "number" ? raw.ev : null,
    ac: typeof raw.ac === "number" ? raw.ac : null,
    physicalPercent: typeof raw.physicalPercent === "number" ? raw.physicalPercent : null,
  };
}

export function seedPaymentDates(
  current: PaymentCut[],
  projectId: string,
  dates: string[],
  origin: PaymentCut["origin"],
): PaymentCut[] {
  const next = [...current];
  dates.forEach((dueDate) => {
    if (!dueDate) return;
    if (next.some((item) => item.projectId === projectId && item.dueDate === dueDate)) return;
    const count = next.filter((item) => item.projectId === projectId).length + 1;
    next.push({
      id: `pay-${projectId}-${dueDate}`,
      projectId,
      dueDate,
      label: `Estado de pago ${count}`,
      origin,
      rule: "",
      note: "",
      frozenAt: null,
      pv: null,
      ev: null,
      ac: null,
      physicalPercent: null,
    });
  });
  return next;
}
