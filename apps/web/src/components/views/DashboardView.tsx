"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/data/DataTable";
import { SCurveChart } from "@/components/charts/SCurveChart";
import { KpiCard } from "@/components/kpi/KpiCard";
import { useOrg } from "@/components/layout/OrgProvider";
import { ELEMENT_KIND_LABELS } from "@/lib/schedule-csv";
import { formatClp, formatRatio } from "@/lib/evm";
import { computeLiveEvm, type ActivityEvmRow } from "@/lib/evm-project";
import { ROLE_LABELS } from "@/lib/constants";
import { StartupChecklist } from "@/components/onboarding/StartupChecklist";
import { KickoffAreaPanel } from "@/components/onboarding/KickoffAreaPanel";
import { ProcessLifecycle } from "@/components/onboarding/ProcessLifecycle";
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

export function DashboardView() {
  const { project, role, teamForProject, assignments, sessionUser, gantt, reports, canOperate, kickoffFor } = useOrg();
  const router = useRouter();
  const team = teamForProject(project.id);
  const activities = useMemo(
    () => gantt.filter((item) => item.projectId === project.id),
    [gantt, project.id],
  );
  const live = useMemo(
    () => computeLiveEvm(project, activities, reports, role),
    [project, activities, reports, role],
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
          <span className="mt-0.5 block text-[11px] text-slate-500">{ELEMENT_KIND_LABELS[row.kind]}</span>
        </span>
      ),
    },
    {
      key: "plan",
      header: "% plan (PV)",
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
            ? "Completa los datos del proyecto. El valor ganado aparece cuando hay calendario."
            : `${project.code}${live.scoped ? " · solo lo asignado a este puesto" : ""}${
                project.bac
                  ? ` · BAC ${formatClp(project.bac)}`
                  : live.moneyMode
                    ? ""
                    : " · sin presupuesto: se mide esfuerzo y plazo"
              }${myNote ? ` · ${myNote}` : ""}`}
        </p>
      </div>

      {project.id !== "prj-pending" && project.kickoffPhase !== "client_done" ? (
        <KickoffAreaPanel
          projectId={project.id}
          kickoff={kickoffFor(project.id) ?? emptyKickoff(project.id, project.clientId)}
          showExtract
        />
      ) : null}

      <StartupChecklist compact />

      <ProcessLifecycle />

      {project.id !== "prj-pending" && project.kickoffPhase === "client_done" ? (
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
              {canOperate("schedule:edit") ? (
                <Link
                  href="/gantt"
                  className="w-full rounded-md border border-slate-200 px-3 py-3 text-center text-sm hover:bg-slate-50 sm:w-auto sm:py-2"
                >
                  Abrir calendario
                </Link>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            CPI = EV / AC (costo). SPI = EV / PV (plazo). Un valor bajo 1 indica desvío. El valor ganado solo
            cuenta con evidencia validada (foto de terreno o documento de escritorio).
          </p>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

          <SCurveChart data={live.series} moneyMode={live.moneyMode} />

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-700">
                {fieldView ? "Labores asignadas" : officeView ? "Partidas a respaldar" : "Actividades del control"}
              </h2>
              <p className="text-xs text-slate-500">
                {live.activities.length
                  ? `${live.activities.length} elemento${live.activities.length === 1 ? "" : "s"}`
                  : "Sin partidas en este puesto"}
              </p>
            </div>
            {live.activities.length ? (
              <DataTable
                columns={columns}
                data={live.activities}
                rowKey={(row) => row.id}
                filterPlaceholder={fieldView ? "Buscar labor…" : "Buscar actividad…"}
                filterFn={(row, query) => `${row.code} ${row.name} ${row.kind}`.toLowerCase().includes(query)}
                actions={
                  canUpload
                    ? [
                        {
                          label: "Registrar",
                          variant: "edit",
                          onClick: () => router.push("/progress"),
                        },
                      ]
                    : undefined
                }
              />
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                {fieldView
                  ? "No hay labores de terreno asignadas a este puesto. El gestor de proyectos las carga en el cronograma (Inspección en terreno, responsable Operaciones o Subcontrato)."
                  : officeView
                    ? "No hay partidas de escritorio asignadas a este puesto. El gestor las carga en el cronograma con tu área como responsable."
                    : "Carga la plantilla EDT en Calendario para armar el valor ganado."}
              </p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
