"use client";

import { BUDGET_EVENT_LABEL, budgetTrail } from "@/lib/budget-history";
import { ROLE_LABELS } from "@/lib/constants";
import { formatClp } from "@/lib/evm";
import type { BudgetEvent, Project } from "@/lib/types";

function when(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return date.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

export function BudgetHistory({
  project,
  events,
}: {
  project: Project;
  events: BudgetEvent[];
}) {
  const trail = budgetTrail(project, events);
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-800">Historial de {project.name}</h2>
      <p className="text-xs text-slate-500">
        El primer monto es lo cargado al crear la obra. Cada cambio del gestor queda aquí, con su razón y su
        archivo, para no repetir una venta que no se pudo sostener.
      </p>
      {trail.length ? (
        <ol className="space-y-2">
          {trail.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                {BUDGET_EVENT_LABEL[item.kind]}
                {item.at ? ` · ${when(item.at)}` : ""}
                {item.byName ? ` · ${item.byName}` : ""}
                {item.byRole ? ` · ${ROLE_LABELS[item.byRole]}` : ""}
              </p>
              <p className="font-medium">{formatClp(item.amountClp)}</p>
              {item.note ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.note}</p> : null}
              {item.evidenceFileName ? (
                <p className="mt-1 text-xs text-slate-500">Archivo: {item.evidenceFileName}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
          Esta obra todavía no tiene un monto. El administrador lo carga en Presupuesto.
        </p>
      )}
    </section>
  );
}
