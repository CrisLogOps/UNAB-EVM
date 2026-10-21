import type { BudgetEvent, BudgetEventKind, Project } from "./types";

export const BUDGET_EVENT_LABEL: Record<BudgetEventKind, string> = {
  inicial: "Presupuesto inicial",
  carga: "Monto confirmado",
  contrapropuesta: "Contrapropuesta del gestor",
  aceptacion: "Aceptado por el gestor",
  aprobacion: "Visto bueno",
};

/** Historial guardado. Si la obra ya tenía monto y nadie registró eventos, muestra ese inicial. */
export function budgetTrail(project: Project, events: BudgetEvent[]): BudgetEvent[] {
  const rows = events
    .filter((item) => item.projectId === project.id)
    .sort((a, b) => (a.at < b.at ? -1 : 1));
  if (rows.length) return rows;
  const amount = project.proposedBac || project.counterBac || project.bac || 0;
  if (!amount) return [];
  return [
    {
      id: `legacy-${project.id}`,
      projectId: project.id,
      at: "",
      kind: project.bac > 0 ? "aprobacion" : "inicial",
      amountClp: project.bac > 0 ? project.bac : amount,
      note: project.budgetNote || "Presupuesto inicial registrado al crear la obra.",
      evidenceFileName: project.counterEvidenceName ?? "",
      byUserId: "",
      byRole: "owner",
      byName: "",
    },
  ];
}

export function latestBudgetEvent(project: Project, events: BudgetEvent[]) {
  const trail = budgetTrail(project, events);
  return trail[trail.length - 1] ?? null;
}
