"use client";

import { useMemo, useState } from "react";
import { MonitorUp, Smartphone } from "lucide-react";
import { ModalForm } from "@/components/forms/ModalForm";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import {
  ELEMENT_KIND_LABELS,
  isFieldEvidenceActivity,
  reportableActivitiesForRole,
} from "@/lib/schedule-csv";

export function ProgressView() {
  const { project, gantt, reports, addProgressReport, canOperate, role, ownerManagesAll } = useOrg();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canEdit = canOperate("evidence:upload");

  const mine = useMemo(() => {
    const activities = gantt.filter((item) => item.projectId === project.id);
    return reportableActivitiesForRole(activities, role, ownerManagesAll || role === "owner");
  }, [gantt, project.id, role, ownerManagesAll]);

  const allProject = useMemo(
    () => gantt.filter((item) => item.projectId === project.id),
    [gantt, project.id],
  );
  const field = mine.filter((item) => isFieldEvidenceActivity(item, allProject));
  const office = mine.filter((item) => !isFieldEvidenceActivity(item, allProject));
  const target = mine.find((item) => item.id === targetId) ?? null;
  const targetIsField = target ? isFieldEvidenceActivity(target, allProject) : false;

  function lastReport(taskId: string) {
    return [...reports].reverse().find((report) => report.taskId === taskId && report.projectId === project.id);
  }

  function evidenceStatusLabel(taskId: string) {
    const last = lastReport(taskId);
    if (!last) return "sin evidencia";
    if (last.evidenceStatus === "validated") return "validada";
    if (last.evidenceStatus === "rejected") return "rechazada";
    return "en revisión";
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Avance · {ROLE_LABELS[role]}
        </p>
        <h1 className="text-xl font-semibold sm:text-2xl">Registro de avance</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          {project.name} · {project.code}. Carga evidencia desde el computador o, en terreno, con la
          cámara. Solo ves partidas del cronograma asignadas a tu área. El gestor valida y recién ahí
          cuenta el avance.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-950">
          <MonitorUp className="mt-0.5 h-4 w-4 shrink-0" />
          Escritorio: PDF, planilla, informe o imagen para las áreas que validan información del plan.
        </p>
        <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
          Terreno: foto desde el celular o el mismo archivo si estás en un equipo de escritorio.
        </p>
      </div>

      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">{message}</p>
      ) : null}

      <ActivityGroup
        title="Terreno"
        hint="Inspecciones y labores de faena"
        items={field}
        empty="No hay inspecciones de terreno asignadas a este puesto."
        canEdit={canEdit}
        onUpload={setTargetId}
        statusOf={evidenceStatusLabel}
      />

      <ActivityGroup
        title="Otras áreas (escritorio)"
        hint="Partidas del cronograma que tu área debe respaldar con documento o dato"
        items={office}
        empty="No hay partidas de escritorio asignadas a este puesto en el cronograma."
        canEdit={canEdit}
        onUpload={setTargetId}
        statusOf={evidenceStatusLabel}
      />

      <ModalForm
        open={Boolean(target)}
        onClose={() => setTargetId(null)}
        title={target ? `Evidencia · ${target.name}` : "Evidencia"}
        requireEvidence
        fieldEvidence={targetIsField}
        submitLabel="Enviar a revisión"
        fields={[
          {
            name: "percent",
            label: "% avance físico",
            type: "number",
            required: true,
            placeholder: "0 a 100",
          },
          { name: "ac", label: "Gasto del día (CLP)", type: "number", required: true, placeholder: "0" },
          { name: "note", label: "Nota", type: "textarea", placeholder: "Qué se ejecutó o qué se valida" },
        ]}
        onSubmit={(values, file) => {
          if (!target) return;
          const percent = Math.min(100, Math.max(0, Number(values.percent) || 0));
          const ok = addProgressReport({
            taskId: target.id,
            physicalPercent: percent / 100,
            actualCost: Number(values.ac) || 0,
            evidenceName: file?.name || "evidencia",
            note: values.note,
          });
          setTargetId(null);
          setMessage(
            ok
              ? `${target.code || target.name}: evidencia enviada (${file?.name}). Cuenta cuando el gestor la valide.`
              : "No se pudo guardar. Revisa la actividad y el archivo.",
          );
        }}
      />
    </div>
  );
}

function ActivityGroup({
  title,
  hint,
  items,
  empty,
  canEdit,
  onUpload,
  statusOf,
}: {
  title: string;
  hint: string;
  items: ReturnType<typeof reportableActivitiesForRole>;
  empty: string;
  canEdit: boolean;
  onUpload: (id: string) => void;
  statusOf: (id: string) => string;
}) {
  return (
    <section>
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {items.length ? (
          items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 px-3 py-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  {item.stage || "General"} · {item.code || "s/c"} · {ELEMENT_KIND_LABELS[item.elementKind]}
                  {item.assigneeRole ? ` · ${ROLE_LABELS[item.assigneeRole]}` : ""}
                </p>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.start} → {item.end} · evidencia {statusOf(item.id)}
                </p>
              </div>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => onUpload(item.id)}
                className="shrink-0 rounded-md bg-[var(--brand)] px-3 py-2 text-xs text-white disabled:opacity-40"
              >
                {canEdit ? "Cargar evidencia" : "Solo consulta"}
              </button>
            </li>
          ))
        ) : (
          <li className="px-3 py-4 text-sm text-slate-500">{empty}</li>
        )}
      </ul>
    </section>
  );
}
