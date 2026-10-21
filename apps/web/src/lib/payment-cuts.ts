import type { PaymentCut } from "./types";

export function normalizePaymentCut(raw: Partial<PaymentCut> | null | undefined): PaymentCut | null {
  if (!raw?.projectId || !raw.dueDate) return null;
  return {
    id: raw.id || `pay-${raw.projectId}-${raw.dueDate}`,
    projectId: raw.projectId,
    dueDate: raw.dueDate,
    label: raw.label?.trim() || "Estado de pago",
    origin: raw.origin === "kickoff" ? "kickoff" : "admin",
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
