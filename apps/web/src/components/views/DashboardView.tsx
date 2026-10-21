"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/data/DataTable";
import { PaymentCutsPanel } from "@/components/views/PaymentCutsPanel";
import { KpiCard } from "@/components/kpi/KpiCard";
import { useOrg } from "@/components/layout/OrgProvider";
import { ELEMENT_KIND_LABELS } from "@/lib/schedule-csv";
import { formatClp, formatRatio, registeredBudgetClp } from "@/lib/evm";
import {
  computeLiveEvm,
  scheduleRunStatus,
  SCHEDULE_RUN_STATUS_LABELS,
  type ActivityEvmRow,
  type ScheduleRunStatus,
} from "@/lib/evm-project";
import { minuteAcRows, minuteTotals } from "@/lib/minutes";
import { ROLE_LABELS } from "@/lib/constants";
import type { ScheduleElementKind } from "@/lib/types";
import { StartupChecklist } from "@/components/onboarding/StartupChecklist";
import { KickoffAreaPanel } from "@/components/onboarding/KickoffAreaPanel";
import { ProcessLifecycle } from "@/components/onboarding/ProcessLifecycle";
import { OperatingModeSwitch } from "@/components/layout/OperatingModeSwitch";
import { emptyKickoff } from "@/lib/kickoff";
import type { AlertStatus } from "@/lib/types";

const STATUS_LABEL = {
  green: "En plan",
  yellow: "Atención",
  red: "Desvío",
} as const;

function formatMeasure(value: number, money: boolean) {
  if (!money) return `${Math.round(value)}`;
  return formatClp(value);
}

function percentLabel(value: number) {
  return `${Math.round(value * 100)}%`;
}

function evidenceLabel(row: ActivityEvmRow) {
  if (!row.requiresEvidence) return "No aplica";
  if (row.evidence === "validated") return "Validada";
  if (row.evidence === "rejected") return "Rechazada";
  if (row.evidence === "uploaded") return "En revisión";
  return "Pendiente";
}

function evidenceKey(row: ActivityEvmRow) {
  if (!row.requiresEvidence) return "na";
  if (row.evidence === "none") return "pending";
  return row.evidence;
}

const STATUS_PILL: Record<ScheduleRunStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  in_progress: "bg-sky-100 text-sky-900",
  done: "bg-emerald-100 text-emerald-900",
  late: "bg-amber-100 text-amber-950",
};

const EVIDENCE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Toda evidencia" },
  { value: "pending", label: "Pendiente" },
  { value: "uploaded", label: "En revisión" },
  { value: "validated", label: "Validada" },
  { value: "rejected", label: "Rechazada" },
  { value: "na", label: "No aplica" },
];

export function DashboardView() {
  const { project, role, teamForProject, assignments, sessionUser, gantt, reports, minutes, canOperate, kickoffFor, isIndividualMode } = useOrg();
  const router = useRouter();
  const team = teamForProject(project.id);
  const activities = useMemo(
    () => gantt.filter((item) => item.projectId === project.id),
    [gantt, project.id],
  );
  const acRows = useMemo(() => minuteAcRows(minutes, project.id), [minutes, project.id]);
  const minuteMoney = minuteTotals(minutes, project.id);
  const live = useMemo(
    () => computeLiveEvm(project, activities, reports, role, undefined, undefined, acRows),
    [project, activities, reports, role, acRows],
  );
  const selected = live.metrics;
  const fieldView = role === "field" || role === "subcontractor";
  const canUpload = canOperate("evidence:upload");
  const officeView =
    role === "finance" ||
    role === "commercial" ||
    role === "warehouse" ||
    role === "oficina_tecnica" ||
    role === "admin_obra";
  const myNote =
    assignments.find((item) => item.projectId === project.id && item.userId === sessionUser.id)?.note ??
    (role === "owner" && !canOperate("schedule:edit")
      ? "Miras cómo va, sin editar la obra"
      : "");

  const [startFrom, setStartFrom] = useState("");
  const [startTo, setStartTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScheduleRunStatus | "">("");
  const [stageFilter, setStageFilter] = useState("");
  const [kindFilter, setKindFilter] = useState<ScheduleElementKind | "">("");
  const [evidenceFilter, setEvidenceFilter] = useState("");

  const stages = useMemo(() => {
    const values = new Set(live.activities.map((item) => item.stage).filter(Boolean));
    return [...values].sort((a, b) => a.localeCompare(b, "es"));
  }, [live.activities]);

  const kinds = useMemo(() => {
    const values = new Set(live.activities.map((item) => item.kind));
    return [...values];
  }, [live.activities]);

  const filteredActivities = useMemo(() => {
    return live.activities.filter((row) => {
      if (startFrom && (!row.start || row.start < startFrom)) return false;
      if (startTo && (!row.start || row.start > startTo)) return false;
      if (statusFilter && scheduleRunStatus(row) !== statusFilter) return false;
      if (stageFilter && row.stage !== stageFilter) return false;
      if (kindFilter && row.kind !== kindFilter) return false;
      if (evidenceFilter && evidenceKey(row) !== evidenceFilter) return false;
      return true;
    });
  }, [live.activities, startFrom, startTo, statusFilter, stageFilter, kindFilter, evidenceFilter]);

  const filtersActive = Boolean(startFrom || startTo || statusFilter || stageFilter || kindFilter || evidenceFilter);

  const columns: Column<ActivityEvmRow>[] = [
    {
      key: "code",
      header: "EDT",
      render: (row) => row.code || "—",
    },
    {
      key: "name",
      header: fieldView ? "Labor" : "Elemento",
      render: (row) => (
        <span>
          <span className="font-medium">{row.name}</span>
          <span className="mt-0.5 block text-[11px] text-slate-500">
            {row.stage} · {ELEMENT_KIND_LABELS[row.kind]}
          </span>
        </span>
      ),
    },
    {
      key: "start",
      header: "Inicio",
      render: (row) => row.start || "s/f",
    },
    {
      key: "window",
      header: "Término",
      render: (row) => row.end || "s/f",
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => {
        const status = scheduleRunStatus(row);
        return (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_PILL[status]}`}>
            {SCHEDULE_RUN_STATUS_LABELS[status]}
          </span>
        );
      },
    },
    {
      key: "plan",
      header: "% plan (PV)",
      hideOnMobile: true,
      render: (row) => percentLabel(row.plannedPercent),
    },
    {
      key: "ev",
      header: "% ganado (EV)",
      render: (row) => percentLabel(row.earnedPercent),
    },
    {
      key: "money",
      header: live.moneyMode ? "EV" : "Peso",
      hideOnMobile: true,
      render: (row) => formatMeasure(row.ev, live.moneyMode),
    },
    {
      key: "evidence",
      header: "Evidencia",
      render: (row) => evidenceLabel(row),
    },
  ];

  const cpiValue = selected.ac > 0 ? formatRatio(selected.cpi) : "—";
  const spiValue = selected.pv > 0 ? formatRatio(selected.spi) : "—";
  const cpiStatus: AlertStatus = selected.ac > 0 ? selected.alerts.cpi : "yellow";
  const spiStatus: AlertStatus = selected.pv > 0 ? selected.alerts.spit : "yellow";
  const controlReady = project.id !== "prj-pending";
  const budgetClp = registeredBudgetClp(project);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {fieldView
            ? `Tus labores · ${ROLE_LABELS[role]}`
            : officeView
              ? `Tus partidas · ${ROLE_LABELS[role]}`
              : "Inicio · arranque y control"}
        </p>
        <h1 className="text-xl font-semibold break-words sm:text-2xl">
          {project.id === "prj-pending" ? "Qué falta para controlar la obra" : project.name}
        </h1>
        <p className="text-sm break-words text-slate-600">
          {project.id === "prj-pending"
            ? "Completa los datos del proyecto. El valor ganado aparece cuando hay cronograma."
            : `${project.code}${live.scoped ? " · solo lo asignado a este puesto" : ""}${
                budgetClp
                  ? ` · presupuesto inicial ${formatClp(budgetClp)}`
                  : " · sin presupuesto: registra el monto para cargar la plantilla EDT"
              }${myNote ? ` · ${myNote}` : ""}`}
        </p>
      </div>

      {controlReady ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Control de la obra</h2>
              <p className="text-sm text-slate-600">
                Equipo: {team.length ? team.map((item) => item.name).join(" · ") : "sin asignaciones"}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {canUpload ? (
                <Link
                  href="/progress"
                  className="w-full rounded-md bg-[var(--brand)] px-3 py-3 text-center text-sm text-white hover:bg-[var(--brand-dark)] sm:w-auto sm:py-2"
                >
                  Cargar avance
                </Link>
              ) : null}
              {canUpload ? (
                <Link
                  href="/minutas"
                  className="w-full rounded-md border border-slate-200 px-3 py-3 text-center text-sm hover:bg-slate-50 sm:w-auto sm:py-2"
                >
                  Minutas
                </Link>
              ) : null}
              {canOperate("schedule:edit") ? (
                <Link
                  href="/gantt"
                  className="w-full rounded-md border border-slate-200 px-3 py-3 text-center text-sm hover:bg-slate-50 sm:w-auto sm:py-2"
                >
                  Abrir cronograma
                </Link>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            CPI = EV / AC (costo). SPI = EV / PV (plazo). Un valor bajo 1 indica desvío. El valor ganado cuenta
            con evidencia validada. El AC suma el costo del avance y los gastos de las minutas. Los cortes
            semanales comparan lo planificado, lo ganado y lo gastado. Un estado de pago cerrado guarda esa lectura.
            {minuteMoney.adicional > 0
              ? ` Adicionales por cobrar: ${formatClp(minuteMoney.adicional)}. No entran al CPI.`
              : ""}
          </p>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Presupuesto inicial"
              value={budgetClp > 0 ? formatClp(budgetClp) : "—"}
              status={budgetClp > 0 ? "green" : "yellow"}
              hint={
                budgetClp > 0
                  ? project.bac > 0
                    ? "BAC aprobado · se reparte en el cronograma de ejemplo"
                    : "Cargado en Presupuesto · la plantilla EDT ya usa este monto"
                  : "Cárgalo en Presupuesto para armar el cronograma de ejemplo"
              }
            />
            <KpiCard
              label="Valor ganado (EV)"
              value={formatMeasure(selected.ev, live.moneyMode)}
              status={selected.evidenceLocked ? "red" : selected.ev >= selected.pv ? "green" : "yellow"}
              hint={
                selected.evidenceLocked
                  ? "Hay evidencias aún sin validar"
                  : `${percentLabel(live.physicalPercent)} del plan de control`
              }
              locked={selected.evidenceLocked}
            />
            <KpiCard
              label="CPI · costo"
              value={cpiValue}
              status={cpiStatus}
              hint={selected.ac > 0 ? "EV / costo real. ≥ 1 es favorable" : "Aún no hay costo real (AC)"}
              trend={selected.ac > 0 ? (selected.cpi >= 1 ? "up" : "down") : undefined}
            />
            <KpiCard
              label="SPI · plazo"
              value={spiValue}
              status={spiStatus}
              hint={selected.pv > 0 ? "EV / valor planificado. ≥ 1 va al día" : "Sin PV: carga el cronograma"}
              trend={selected.pv > 0 ? (selected.spi >= 1 ? "up" : "down") : undefined}
            />
            <KpiCard
              label="Planificado (PV)"
              value={formatMeasure(selected.pv, live.moneyMode)}
              status={selected.pv > 0 ? "green" : "yellow"}
              hint={`Costo real (AC) ${formatMeasure(selected.ac, live.moneyMode)}`}
            />
          </section>

          <PaymentCutsPanel />

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-700">
                {fieldView ? "Labores asignadas" : officeView ? "Partidas a respaldar" : "Actividades del control"}
              </h2>
              <p className="text-xs text-slate-500">
                {live.activities.length
                  ? `${filteredActivities.length} de ${live.activities.length} elemento${live.activities.length === 1 ? "" : "s"} del cronograma`
                  : "Sin partidas en este puesto"}
              </p>
            </div>
            {live.activities.length ? (
              <>
                <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 lg:grid-cols-3 xl:grid-cols-6">
                  <label className="block min-w-0 text-xs">
                    <span className="mb-1 block font-medium text-slate-600">Inicio desde</span>
                    <input
                      type="date"
                      lang="es-CL"
                      value={startFrom}
                      onChange={(event) => setStartFrom(event.target.value)}
                      className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="block min-w-0 text-xs">
                    <span className="mb-1 block font-medium text-slate-600">Inicio hasta</span>
                    <input
                      type="date"
                      lang="es-CL"
                      value={startTo}
                      min={startFrom || undefined}
                      onChange={(event) => setStartTo(event.target.value)}
                      className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="block min-w-0 text-xs">
                    <span className="mb-1 block font-medium text-slate-600">Estado</span>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as ScheduleRunStatus | "")}
                      className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    >
                      <option value="">Todos</option>
                      {(Object.keys(SCHEDULE_RUN_STATUS_LABELS) as ScheduleRunStatus[]).map((key) => (
                        <option key={key} value={key}>
                          {SCHEDULE_RUN_STATUS_LABELS[key]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 text-xs">
                    <span className="mb-1 block font-medium text-slate-600">Fase</span>
                    <select
                      value={stageFilter}
                      onChange={(event) => setStageFilter(event.target.value)}
                      className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    >
                      <option value="">Todas</option>
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 text-xs">
                    <span className="mb-1 block font-medium text-slate-600">Tipo</span>
                    <select
                      value={kindFilter}
                      onChange={(event) => setKindFilter(event.target.value as ScheduleElementKind | "")}
                      className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    >
                      <option value="">Todos</option>
                      {kinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {ELEMENT_KIND_LABELS[kind]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 text-xs">
                    <span className="mb-1 block font-medium text-slate-600">Evidencia</span>
                    <select
                      value={evidenceFilter}
                      onChange={(event) => setEvidenceFilter(event.target.value)}
                      className="w-full min-w-0 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    >
                      {EVIDENCE_FILTERS.map((item) => (
                        <option key={item.value || "all"} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {filtersActive ? (
                    <div className="col-span-2 flex items-end lg:col-span-3 xl:col-span-6">
                      <button
                        type="button"
                        onClick={() => {
                          setStartFrom("");
                          setStartTo("");
                          setStatusFilter("");
                          setStageFilter("");
                          setKindFilter("");
                          setEvidenceFilter("");
                        }}
                        className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50"
                      >
                        Quitar filtros
                      </button>
                    </div>
                  ) : null}
                </div>
                <p className="mb-2 text-[11px] text-slate-500">
                  Los filtros recortan la tabla según el cronograma. El gráfico y los KPI siguen el proyecto completo.
                </p>
                <DataTable
                  columns={columns}
                  data={filteredActivities}
                  rowKey={(row) => row.id}
                  filterPlaceholder={fieldView ? "Buscar labor…" : "Buscar actividad…"}
                  filterFn={(row, query) =>
                    `${row.code} ${row.name} ${row.stage} ${row.kind} ${row.start} ${row.end} ${SCHEDULE_RUN_STATUS_LABELS[scheduleRunStatus(row)]} ${evidenceLabel(row)}`
                      .toLowerCase()
                      .includes(query)
                  }
                  actions={
                    canUpload
                      ? [
                          {
                            label: "Registrar",
                            variant: "edit",
                            onClick: (row) => router.push(`/progress?task=${encodeURIComponent(row.id)}`),
                          },
                        ]
                      : undefined
                  }
                />
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                {fieldView
                  ? "No hay labores de terreno asignadas a este puesto. El gestor de proyectos las carga en el cronograma (Inspección en terreno, responsable Operaciones o Subcontrato)."
                  : officeView
                    ? "No hay partidas de escritorio asignadas a este puesto. El gestor las carga en el cronograma con tu área como responsable."
                    : budgetClp > 0
                      ? "Carga o confirma la plantilla EDT en Cronograma para armar el valor ganado."
                      : "Registra el presupuesto inicial. Con ese monto se carga la plantilla EDT y este dashboard."}
              </p>
            )}
          </section>
        </>
      ) : null}

      {project.id !== "prj-pending" && project.kickoffPhase !== "client_done" ? (
        isIndividualMode ? (
          <section className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-sm text-slate-700">
            <p className="font-semibold">Kickoff interno</p>
            <p className="mt-1">
              En la vista individual registrás lo vendido, notas para el cliente y el criterio PMBOK. No hay revisión
              entre áreas. El expediente se valida en el kickoff con el mandante.
            </p>
            <Link href="/clients" className="mt-3 inline-block text-sm font-medium text-[var(--brand)] underline">
              Continuar en Clientes
            </Link>
          </section>
        ) : (
          <KickoffAreaPanel
            projectId={project.id}
            kickoff={kickoffFor(project.id) ?? emptyKickoff(project.id, project.clientId)}
            showExtract
          />
        )
      ) : null}

      <StartupChecklist compact />

      <ProcessLifecycle />

      <OperatingModeSwitch variant="panel" />
    </div>
  );
}
