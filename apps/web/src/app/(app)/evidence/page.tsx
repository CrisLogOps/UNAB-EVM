"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { isFieldEvidenceActivity } from "@/lib/schedule-csv";

function EvidenceReviewView() {
  const { project, gantt, reports, users, reviewEvidence, canOperate } = useOrg();
  const canReview = canOperate("evidence:approve");
  const queue = reports.filter((item) => item.projectId === project.id);
  const activities = gantt.filter((item) => item.projectId === project.id);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Validación de avance</p>
        <h1 className="text-2xl font-semibold">Evidencias</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          El gestor valida fotos de terreno y documentos de escritorio. Sin esa validación, el avance no
          cuenta en el paquete de trabajo ni en el valor ganado.
        </p>
      </div>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {queue.length ? (
          queue.map((item) => {
            const activity = activities.find((row) => row.id === item.taskId);
            const who = users.find((user) => user.id === item.reportedBy);
            const fromField = activity ? isFieldEvidenceActivity(activity, activities) : false;
            return (
              <li key={item.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {activity?.code ? `${activity.code} · ` : ""}
                    {activity?.name ?? "Actividad"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {fromField ? "Terreno" : "Escritorio"} · {who?.name || ROLE_LABELS[who?.role ?? "field"]} ·{" "}
                    {item.period} · {Math.round(item.physicalPercent * 100)}% · {item.evidenceName || "archivo"} ·{" "}
                    {item.evidenceStatus === "validated"
                      ? "validada"
                      : item.evidenceStatus === "rejected"
                        ? "rechazada"
                        : "en revisión"}
                  </p>
                  {item.note ? <p className="mt-1 text-sm text-slate-600">{item.note}</p> : null}
                </div>
                {item.evidenceStatus === "uploaded" && canReview ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => reviewEvidence(item.id, "validated")}
                      className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs text-white"
                    >
                      Validar
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewEvidence(item.id, "rejected")}
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs"
                    >
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">
                    {ROLE_LABELS.pmo} {item.evidenceStatus === "uploaded" ? "debe validar" : ""}
                  </span>
                )}
              </li>
            );
          })
        ) : (
          <li className="px-4 py-6 text-sm text-slate-500">
            Todavía no hay evidencias. Cada área las carga en Avance, sobre las partidas del cronograma que
            le tocan.
          </li>
        )}
      </ul>
    </div>
  );
}

export default function EvidencePage() {
  return (
    <RoleGate allow={["pmo", "oficina_tecnica", "admin_obra", "owner"]} permission="evidence:approve">
      <EvidenceReviewView />
    </RoleGate>
  );
}
