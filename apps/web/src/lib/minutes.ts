import type { MinuteCostEffect, MinuteOrigin, SiteMinute } from "./types";

export const MINUTE_ORIGIN_LABEL: Record<MinuteOrigin, string> = {
  mandante: "Mandante",
  arquitecto: "Arquitecto",
  interno: "Equipo de la obra",
};

export const MINUTE_COST_LABEL: Record<MinuteCostEffect, string> = {
  gasto: "Gasto de la obra",
  adicional: "Adicional por cobrar",
  sin_costo: "Sin efecto en costo",
};

export function minuteTotals(minutes: SiteMinute[], projectId: string) {
  const mine = minutes.filter((item) => item.projectId === projectId);
  const sum = (effect: MinuteCostEffect) =>
    mine.filter((item) => item.costEffect === effect).reduce((total, item) => total + (item.amountClp || 0), 0);
  return { gasto: sum("gasto"), adicional: sum("adicional"), count: mine.length };
}

/** Gastos de minuta que entran al AC. El adicional no se absorbe en el CPI. */
export function minuteAcRows(minutes: SiteMinute[], projectId: string) {
  return minutes
    .filter((item) => item.projectId === projectId && item.costEffect === "gasto" && item.amountClp > 0)
    .map((item) => ({
      period: item.occurredOn,
      taskId: item.activityId,
      amount: item.amountClp,
    }));
}
