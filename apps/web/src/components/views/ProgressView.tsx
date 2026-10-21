"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MonitorUp, Smartphone } from "lucide-react";
import { ModalForm } from "@/components/forms/ModalForm";
import { ActivityAdvancePanel } from "@/components/views/ActivityAdvancePanel";
import { useOrg } from "@/components/layout/OrgProvider";
import { CLOSURE_LABEL } from "@/lib/activity-progress";
import { ROLE_LABELS } from "@/lib/constants";
import {
  ELEMENT_KIND_LABELS,
  childrenOf,
  isFieldEvidenceActivity,
  leafDescendants,
  reportableActivitiesForRole,
  scheduleSummaries,
} from "@/lib/schedule-csv";

export function ProgressView() {
  const searchParams = useSearchParams();
  const {
    project,
    gantt,
    reports,
    addProgressReport,
    completeWorkPackage,
    canOperate,
    role,
    ownerManagesAll,
    isIndividualMode,
  } = useOrg();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canEdit = canOperate("evidence:upload") || isIndividualMode || ownerManagesAll;

  const allProject = useMemo(
    () => gantt.filter((item) => item.projectId === project.id),
    [gantt, project.id],
  );

  const mine = useMemo(
    () => reportableActivitiesForRole(allProject, role, ownerManagesAll || role === "owner" || isIndividualMode),
    [allProject, role, ownerManagesAll, isIndividualMode],
  );

  const field = mine.filter((item) => isFieldEvidenceActivity(item, allProject));
  const office = mine.filter((item) => !isFieldEvidenceActivity(item, allProject));
  const packages = scheduleSummaries(allProject);
  const target = mine.find((item) => item.id === targetId) ?? null;
  const closing = packages.find((item) => item.id === closingId) ?? null;
  const targetIsField = target ? isFieldEvidenceActivity(target, allProject) : false;
  const focusId = searchParams.get("task");

  useEffect(() => {
    if (!focusId) return;
    if (mine.some((item) => item.id === focusId)) setTargetId(focusId);
  }, [focusId, mine]);

  function lastReport(taskId: string) {
    return [...reports].reverse().find((report) => report.taskId === taskId && report.projectId === project.id);
  }

  function evidenceStatusLabel(taskId: string) {
    const last = lastReport(taskId);
    if (!last) return "sin registrar";
    const closure = last.closure ? CLOSURE_LABEL[last.closure] : "";
    if (last.evidenceStatus === "validated") return closure ? `${closure} · validada` : "validada";
    if (last.evidenceStatus === "rejected") return closure ? `${closure} · rechazada` : "rechazada";
    return closure ? `${closure} · en revisión` : "en revisión";
  }

  function packageHint(item: (typeof packages)[number]) {
    const leaves = leafDescendants(item, allProject).filter((row) => row.id !== item.id);
    if (!leaves.length) return "Sin partidas hijas.";
    const pending = leaves.filter((row) => row.progress < 100).length;
    const codes = leaves.map((row) => row.code || row.name).join(", ");
    if (!pending) return `Cerrado con ${codes}.`;
    return `Se cierra con ${codes}. Faltan ${pending}.`;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Avance · {ROLE_LABELS[role]}
        </p>
        <h1 className="text-xl font-semibold sm:text-2xl">Registro de avance</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          {project.name} · {project.code}.{" "}
          {isIndividualMode
            ? "El paquete no se avanza solo. En cada actividad hija registrás un avance parcial según su naturaleza: archivos, mediciones o versiones. El cierre queda parcial hasta confirmarlo, o queda con un requisito o no conforme."
            : "En cada actividad hija el % se arma con archivos, mediciones o versiones y puede quedar parcial. En terreno cuenta cuando la contraparte lo confirma. Un requisito o un no conforme no sube el %."}{" "}
          El gasto y las instrucciones de cambio se anotan en{" "}
          <Link href="/minutas" className="underline">
            Minutas
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-950">
          <MonitorUp className="mt-0.5 h-4 w-4 shrink-0" />
          Escritorio y planificación: PDF, nota o % de avance. El archivo es opcional si no es inspección de
          terreno.
        </p>
        <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
          Terreno: foto desde el celular o el mismo archivo si estás en un equipo de escritorio.
        </p>
      </div>

      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">{message}</p>
      ) : null}

      {target ? (
        <ActivityAdvancePanel
          key={target.id}
          activity={target}
          requireFile={targetIsField && !isIndividualMode}
          onClose={() => setTargetId(null)}
          onSubmit={(input) => {
            const ok = addProgressReport({
              taskId: target.id,
              physicalPercent: input.percent / 100,
              actualCost: input.ac,
              evidenceName: input.fileName,
              note: input.note,
              closure: input.closure,
              pieceIds: input.pieceIds,
              scopeNote: input.scopeNote,
              doneWhen: input.doneWhen,
              nature: input.nature,
              pieces: input.pieces,
            });
            if (!ok) return "No se pudo guardar. Revisa el archivo o la nota.";
            setTargetId(null);
            setMessage(
              input.closure === "conforme"
                ? `${target.code || target.name}: conforme al ${input.percent}%.`
                : input.closure === "no_conforme"
                  ? `${target.code || target.name}: quedó no conforme. El % no sube.`
                  : input.closure === "prerequisito"
                    ? `${target.code || target.name}: queda a la espera del requisito. El % no sube.`
                    : targetIsField && !isIndividualMode
                      ? `${target.code || target.name}: avance parcial ${input.percent}% enviado a la contraparte.`
                      : `${target.code || target.name}: avance parcial ${input.percent}% registrado.`,
            );
            return null;
          }}
        />
      ) : null}

      {packages.length ? (
        <section>
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-slate-800">Paquetes / EDT padre</h2>
            <p className="text-xs text-slate-500">
              El encabezado no lleva avance propio. Cada actividad hija admite un avance parcial. Completar el
              paquete cierra de una vez las que sigan pendientes.
            </p>
          </div>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {packages.map((item) => {
              const focused = focusId === item.id;
              const kids = childrenOf(allProject, item.code);
              const pending = leafDescendants(item, allProject).filter((row) => row.progress < 100);
              return (
                <li
                  key={item.id}
                  id={`task-${item.id}`}
                  className={`flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3 ${
                    focused ? "bg-sky-50" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      {item.stage || "General"} · {item.code || "s/c"} · {ELEMENT_KIND_LABELS[item.elementKind]}
                    </p>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">{packageHint(item)}</p>
                    {kids.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {leafDescendants(item, allProject)
                          .filter((row) => row.id !== item.id)
                          .map((row) => (
                            <button
                              key={row.id}
                              type="button"
                              disabled={!canEdit || !mine.some((entry) => entry.id === row.id)}
                              onClick={() => setTargetId(row.id)}
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-40"
                            >
                              Avance parcial · {row.code || row.name} · {row.progress}%
                            </button>
                          ))}
                      </div>
                    ) : null}
                  </div>
                  {canEdit && pending.length ? (
                    <button
                      type="button"
                      onClick={() => setClosingId(item.id)}
                      className="min-h-11 w-full rounded-md bg-[var(--brand)] px-3 py-2 text-xs text-white sm:w-auto sm:shrink-0"
                    >
                      Completar paquete
                    </button>
                  ) : pending.length ? (
                    <p className="text-xs text-slate-500">Pendiente</p>
                  ) : (
                    <p className="text-xs text-emerald-800">Cumplido</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <ActivityGroup
        title="Terreno"
        hint="Inspecciones y labores de faena (foto o archivo)"
        items={field}
        empty="No hay inspecciones de terreno en este cronograma."
        canEdit={canEdit}
        onUpload={setTargetId}
        statusOf={evidenceStatusLabel}
        actionLabel="Cargar evidencia"
        focusId={focusId}
      />

      <ActivityGroup
        title="Planificación y escritorio"
        hint="Partidas de escritorio: el % se arma con archivos, registros o versiones, y puede quedar parcial"
        items={office}
        empty="No hay partidas de escritorio o planificación para registrar."
        canEdit={canEdit}
        onUpload={setTargetId}
        statusOf={evidenceStatusLabel}
        actionLabel="Registrar avance"
        focusId={focusId}
      />

      <ModalForm
        key={closing?.id ?? "paquete"}
        open={Boolean(closing)}
        onClose={() => setClosingId(null)}
        title={
          closing
            ? `Cerrar paquete · ${closing.code ? `${closing.code} · ` : ""}${closing.name}`
            : "Cerrar paquete"
        }
        optionalEvidence
        submitLabel="Cerrar y guardar"
        fields={[
          {
            name: "note",
            label: "Razón del cierre",
            type: "textarea",
            placeholder: "Qué se hizo y por qué el paquete queda cerrado",
          },
        ]}
        validate={(values, file) => {
          const note = values.note.trim();
          if (note.length >= 8 || file) return null;
          return "Escribe una razón de al menos 8 caracteres o adjunta un archivo.";
        }}
        onSubmit={(values, file) => {
          if (!closing) return;
          const count = completeWorkPackage(closing.id, {
            note: values.note,
            evidenceName: file?.name,
          });
          setClosingId(null);
          setMessage(
            count
              ? `${closing.code || closing.name}: se cerraron ${count} partidas. La razón quedó en Evidencias y en Conocimiento.`
              : "Ese paquete ya estaba cerrado.",
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
  actionLabel,
  focusId,
}: {
  title: string;
  hint: string;
  items: ReturnType<typeof reportableActivitiesForRole>;
  empty: string;
  canEdit: boolean;
  onUpload: (id: string) => void;
  statusOf: (id: string) => string;
  actionLabel: string;
  focusId: string | null;
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
            <li
              key={item.id}
              id={`task-${item.id}`}
              className={`flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3 ${
                focusId === item.id ? "bg-sky-50" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  {item.stage || "General"} · {item.code || "s/c"} · {ELEMENT_KIND_LABELS[item.elementKind]}
                  {item.assigneeRole ? ` · ${ROLE_LABELS[item.assigneeRole]}` : ""}
                </p>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.start} → {item.end} · {statusOf(item.id)}
                </p>
              </div>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => onUpload(item.id)}
                className="min-h-11 w-full rounded-md bg-[var(--brand)] px-3 py-2 text-xs text-white disabled:opacity-40 sm:w-auto sm:shrink-0"
              >
                {canEdit ? actionLabel : "Solo consulta"}
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
