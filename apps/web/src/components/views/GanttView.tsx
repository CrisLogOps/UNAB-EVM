"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ModalForm } from "@/components/forms/ModalForm";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { scheduleUnlocked } from "@/lib/kickoff";
import {
  ELEMENT_KIND_LABELS,
  buildScheduleTemplateCsv,
  childrenOf,
  downloadTextFile,
  hasScheduleDeviation,
  parseScheduleCsv,
  rolledProgress,
} from "@/lib/schedule-csv";
import type { GanttActivity, ScheduleElementKind, UserRole } from "@/lib/types";

function toDay(iso: string) {
  return new Date(`${iso}T00:00:00`).getTime();
}

const PROFILE_OPTIONS: { value: UserRole | ""; label: string }[] = [
  { value: "field", label: ROLE_LABELS.field },
  { value: "subcontractor", label: ROLE_LABELS.subcontractor },
  { value: "pmo", label: ROLE_LABELS.pmo },
  { value: "finance", label: ROLE_LABELS.finance },
  { value: "commercial", label: ROLE_LABELS.commercial },
  { value: "warehouse", label: ROLE_LABELS.warehouse },
  { value: "admin_obra", label: ROLE_LABELS.admin_obra },
  { value: "oficina_tecnica", label: ROLE_LABELS.oficina_tecnica },
  { value: "", label: "Sin asignar" },
];

const KIND_OPTIONS: { value: ScheduleElementKind; label: string }[] = [
  { value: "paquete", label: ELEMENT_KIND_LABELS.paquete },
  { value: "actividad", label: ELEMENT_KIND_LABELS.actividad },
  { value: "inspeccion", label: ELEMENT_KIND_LABELS.inspeccion },
  { value: "hito", label: ELEMENT_KIND_LABELS.hito },
];

function kindBadgeClass(kind: ScheduleElementKind) {
  if (kind === "hito") return "bg-indigo-50 text-indigo-900";
  if (kind === "inspeccion") return "bg-amber-50 text-amber-900";
  if (kind === "paquete") return "bg-slate-100 text-slate-700";
  return "bg-sky-50 text-sky-900";
}

export function GanttView() {
  const { project, gantt, reports, addGanttActivity, updateGanttActivity, importSchedule, canOperate } =
    useOrg();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GanttActivity | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const activities = gantt.filter((item) => item.projectId === project.id);
  const kickoffLocked = !scheduleUnlocked(project);
  const locked = !canOperate("schedule:edit") || kickoffLocked;
  const roots = activities.filter((item) => !item.parentCode);

  const range = useMemo(() => {
    const dates = [
      project.startDate,
      project.finishDate,
      ...activities.flatMap((item) => [item.start, item.end]),
    ].map(toDay);
    const min = Math.min(...dates);
    const max = Math.max(...dates);
    return { min, max, span: Math.max(max - min, 1) };
  }, [activities, project]);

  const stages = useMemo(() => {
    const map = new Map<string, GanttActivity[]>();
    roots.forEach((item) => {
      const key = item.stage || "General";
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return [...map.entries()];
  }, [roots]);

  function handleCsv(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { rows, errors } = parseScheduleCsv(text);
      if (errors.length && !rows.length) {
        setNotice(errors[0]);
        return;
      }
      const count = importSchedule(rows);
      const inspections = rows.filter((row) => row.elementKind === "inspeccion" || row.requiresFieldEvidence).length;
      const office = rows.filter(
        (row) =>
          row.assigneeRole &&
          row.assigneeRole !== "field" &&
          row.assigneeRole !== "subcontractor" &&
          !row.requiresFieldEvidence &&
          row.elementKind !== "hito" &&
          row.elementKind !== "paquete",
      ).length;
      const milestones = rows.filter((row) => row.elementKind === "hito").length;
      setNotice(
        errors.length
          ? `Se cargaron ${count} elementos (${inspections} inspecciones, ${office} de escritorio, ${milestones} hitos). ${errors.length} se omitieron.`
          : `Línea base cargada: ${count} elementos EDT, ${inspections} inspecciones en terreno, ${office} partidas de escritorio, ${milestones} hitos.`,
      );
    };
    reader.readAsText(file, "utf-8");
  }

  function renderBar(item: GanttActivity, nested = false) {
    const left = ((toDay(item.start) - range.min) / range.span) * 100;
    const width = ((toDay(item.end) - toDay(item.start)) / range.span) * 100;
    const progress = rolledProgress(item, activities, reports);
    const kids = childrenOf(activities, item.code);
    const deviation = hasScheduleDeviation(item);
    return (
      <div key={item.id} className={nested ? "ml-4 border-l border-slate-200 pl-3" : ""}>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-800">
            {item.code ? `${item.code} · ` : ""}
            {item.name}
            <span className={`ml-2 rounded px-1.5 py-0.5 font-normal ${kindBadgeClass(item.elementKind)}`}>
              {ELEMENT_KIND_LABELS[item.elementKind]}
            </span>
            {deviation ? (
              <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 font-normal text-rose-800">
                desvío vs línea base
              </span>
            ) : null}
            <span className="ml-2 font-normal text-slate-500">
              {item.assigneeRole ? ROLE_LABELS[item.assigneeRole] : "Sin responsable"}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span>
              {item.start} → {item.end} · {progress}%
            </span>
            {!locked ? (
              <button
                type="button"
                onClick={() => setEditing(item)}
                className="rounded border border-slate-200 px-2 py-0.5 hover:bg-slate-50"
              >
                Editar
              </button>
            ) : null}
          </span>
        </div>
        <div className="relative h-7 rounded bg-slate-100">
          <div
            className="absolute top-0 h-7 rounded bg-[var(--brand)]/80"
            style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
          />
          <div
            className="absolute top-0 h-7 rounded bg-[var(--accent)]"
            style={{
              left: `${left}%`,
              width: `${Math.max(width * (progress / 100), 1)}%`,
            }}
          />
        </div>
        {kids.length ? <div className="mt-3 space-y-3">{kids.map((child) => renderBar(child, true))}</div> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {kickoffLocked ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          El cronograma se abre cuando Comercial y el gestor de proyectos cierran el kickoff interno y se confirma el kickoff con el cliente.{" "}
          <Link href="/clients" className="underline">
            Ir a clientes y kickoff
          </Link>
          .
        </p>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Cronograma de la obra</p>
          <h1 className="text-xl font-semibold sm:text-2xl">Calendario</h1>
          <p className="text-sm text-slate-600">
            {project.name} · {project.code}. Plantilla EDT (paquetes, actividades, inspecciones e hitos).
            Si hay desvío, el jefe de proyecto edita el elemento sin perder la línea base.
            {locked ? " · solo consulta" : ""}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `plantilla-edt-${project.code || "CP-001"}.csv`,
                buildScheduleTemplateCsv(project.code, project.startDate, project.finishDate),
              )
            }
            className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Descargar plantilla CSV
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"
          >
            Subir cronograma
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => setOpen(true)}
            className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)] disabled:opacity-40"
          >
            Agregar elemento
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              handleCsv(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">{notice}</p>
      ) : null}

      <p className="text-xs text-slate-500">
        Columnas: Código EDT, EDT padre, Tipo de elemento (Paquete de trabajo, Actividad, Inspección en
        terreno, Hito), Fase, Nombre, Fecha de inicio, Fecha de término, Responsable, Presupuesto
        planificado (CLP), Inspección en terreno (Sí/No). El avance del paquete se calcula con evidencia
        validada: foto de faena o documento de escritorio según el responsable. Un hito marca un punto de
        control (misma fecha de inicio y término). Las áreas de escritorio cargan su respaldo en Avance.
      </p>

      <div className="space-y-3 md:hidden">
        {activities.map((item) => {
          const progress = rolledProgress(item, activities, reports);
          return (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                {item.stage || "General"} · {item.code || "s/c"} · {ELEMENT_KIND_LABELS[item.elementKind]}
                {item.parentCode ? ` · EDT padre ${item.parentCode}` : ""}
              </p>
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.start} → {item.end} · {item.assigneeRole ? ROLE_LABELS[item.assigneeRole] : "Sin responsable"}
                {hasScheduleDeviation(item) ? " · desvío vs línea base" : ""}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded bg-slate-100">
                <div className="h-2 rounded bg-[var(--accent)]" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-600">{progress}%</p>
                {!locked ? (
                  <button type="button" className="text-xs underline" onClick={() => setEditing(item)}>
                    Editar desvío
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
        {!activities.length ? (
          <p className="text-sm text-slate-500">Sin elementos. Descarga la plantilla EDT o agrega el primero.</p>
        ) : null}
      </div>

      <div className="hidden space-y-6 md:block">
        {stages.map(([stage, items]) => (
          <section key={stage} className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">{stage}</h2>
            <div className="min-w-[640px] space-y-3">{items.map((item) => renderBar(item))}</div>
          </section>
        ))}
        {!activities.length ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            Sin elementos. Descarga la plantilla CSV, completa paquetes, actividades, inspecciones e hitos, y
            súbela.
          </p>
        ) : null}
      </div>

      <ModalForm
        open={open}
        onClose={() => setOpen(false)}
        title="Elemento del cronograma"
        fields={[
          { name: "code", label: "Código EDT", type: "text", required: true, placeholder: `${project.code || "CP-001"}.1` },
          {
            name: "parentCode",
            label: "EDT padre (vacío = paquete o hito de primer nivel)",
            type: "text",
            placeholder: `${project.code || "CP-001"}.1`,
          },
          {
            name: "elementKind",
            label: "Tipo de elemento",
            type: "select",
            required: true,
            options: KIND_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
            defaultValue: "actividad",
          },
          { name: "stage", label: "Fase", type: "text", required: true, placeholder: "Inducción" },
          { name: "name", label: "Nombre", type: "text", required: true },
          { name: "start", label: "Fecha de inicio", type: "date", required: true, defaultValue: project.startDate },
          { name: "end", label: "Fecha de término", type: "date", required: true, defaultValue: project.finishDate },
          {
            name: "assigneeRole",
            label: "Responsable",
            type: "select",
            options: PROFILE_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
            defaultValue: "pmo",
          },
          {
            name: "requiresFieldEvidence",
            label: "Evidencia de terreno",
            type: "select",
            options: [
              { value: "si", label: "Sí, foto o documento desde faena" },
              { value: "no", label: "No: si asignas otra área, carga evidencia de escritorio" },
            ],
            defaultValue: "no",
          },
          { name: "budgetPv", label: "Presupuesto planificado (CLP)", type: "number", placeholder: "0" },
        ]}
        onSubmit={(values) => {
          const parentCode = values.parentCode.trim();
          const elementKind = (values.elementKind || "actividad") as ScheduleElementKind;
          const requiresFieldEvidence = values.requiresFieldEvidence === "si" || elementKind === "inspeccion";
          addGanttActivity({
            code: values.code,
            parentCode,
            stage: values.stage,
            name: values.name,
            start: values.start,
            end: values.end,
            progress: 0,
            assigneeRole: (values.assigneeRole || (requiresFieldEvidence ? "field" : "pmo")) as UserRole | "",
            budgetPv: Number(values.budgetPv) || 0,
            elementKind,
            requiresFieldEvidence: elementKind === "hito" ? false : requiresFieldEvidence,
            baselineStart: values.start,
            baselineFinish: values.end,
          });
          setOpen(false);
        }}
      />

      {editing ? (
        <ModalForm
          key={editing.id}
          open
          onClose={() => setEditing(null)}
          title={`Editar desvío · ${editing.code || editing.name} (plan ${editing.baselineStart} → ${editing.baselineFinish})`}
          submitLabel="Guardar desvío"
          fields={[
            { name: "name", label: "Nombre", type: "text", required: true, defaultValue: editing.name },
            {
              name: "elementKind",
              label: "Tipo de elemento",
              type: "select",
              options: KIND_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
              defaultValue: editing.elementKind,
            },
            { name: "start", label: "Fecha de inicio actual", type: "date", required: true, defaultValue: editing.start },
            { name: "end", label: "Fecha de término actual", type: "date", required: true, defaultValue: editing.end },
            {
              name: "assigneeRole",
              label: "Responsable",
              type: "select",
              options: PROFILE_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
              defaultValue: editing.assigneeRole,
            },
            {
              name: "requiresFieldEvidence",
              label: "Evidencia de terreno",
              type: "select",
              options: [
                { value: "si", label: "Sí, foto o documento desde faena" },
                { value: "no", label: "No: si asignas otra área, carga evidencia de escritorio" },
              ],
              defaultValue: editing.requiresFieldEvidence ? "si" : "no",
            },
            {
              name: "budgetPv",
              label: "Presupuesto planificado (CLP)",
              type: "number",
              defaultValue: String(editing.budgetPv || 0),
            },
          ]}
          onSubmit={(values) => {
            const elementKind = (values.elementKind || editing.elementKind) as ScheduleElementKind;
            updateGanttActivity(editing.id, {
              name: values.name,
              start: values.start,
              end: values.end,
              assigneeRole: (values.assigneeRole || "") as UserRole | "",
              elementKind,
              requiresFieldEvidence: elementKind === "hito" ? false : values.requiresFieldEvidence !== "no",
              budgetPv: Number(values.budgetPv) || 0,
            });
            setEditing(null);
            setNotice(
              `Desvío guardado. Plan original: ${editing.baselineStart} → ${editing.baselineFinish}. Actual: ${values.start} → ${values.end}.`,
            );
          }}
        />
      ) : null}
    </div>
  );
}
