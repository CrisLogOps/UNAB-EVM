"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useOrg } from "@/components/layout/OrgProvider";
import { teamCoverageMode } from "@/lib/coverage";
import {
  LIFECYCLE_STATUS_LABEL,
  evaluateProcessLifecycle,
  type EvaluatedPhase,
  type LifecycleStatus,
} from "@/lib/process-lifecycle";

const STATUS_CLASS: Record<LifecycleStatus, string> = {
  done: "bg-emerald-50 text-emerald-800",
  current: "bg-sky-100 text-sky-900",
  open: "bg-white text-slate-600",
  partial: "bg-amber-50 text-amber-900",
  planned: "bg-slate-100 text-slate-500",
};

export function ProcessLifecycle() {
  const {
    setupPhase,
    clients,
    project,
    kickoffFor,
    areas,
    assignments,
    gantt,
    reports,
    knowledge,
    tenant,
    users,
  } = useOrg();
  const phases = useMemo(
    () =>
      evaluateProcessLifecycle({
        setupDone: setupPhase === "done",
        clients,
        project,
        kickoff: project.id === "prj-pending" ? undefined : kickoffFor(project.id),
        areas,
        assignments,
        activities: gantt.filter((item) => item.projectId === project.id),
        reports,
        knowledge,
        independent: tenant.companySize === "independent" || teamCoverageMode(users) === "solo",
      }),
    [
      setupPhase,
      clients,
      project,
      kickoffFor,
      areas,
      assignments,
      gantt,
      reports,
      knowledge,
      tenant.companySize,
      users,
    ],
  );
  const current = phases.find((item) => item.status === "current" || item.status === "partial") ?? phases[0];
  const [openId, setOpenId] = useState<string | null>(null);
  const expanded = openId;
  const productDone = phases.reduce((sum, item) => sum + item.done, 0);
  const productTotal = phases.reduce((sum, item) => sum + item.total, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Ciclo del contrato · F0 a F7</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Proceso según el flujo de la obra</h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Pulsa una fase para ver sus pasos. Los comentarios de kickoff están arriba.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {productDone} de {productTotal} pasos operables cerrados en esta obra. Fuente: Resumen_Fases Rev3.
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2 lg:grid-cols-8">
        {phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            onClick={() => setOpenId((current) => (current === phase.id ? null : phase.id))}
            className={`rounded-lg border px-2 py-2 text-left ${
              phase.id === expanded
                ? "border-sky-400 bg-sky-50"
                : phase.id === current?.id
                  ? "border-slate-300 bg-white"
                  : "border-slate-200 bg-slate-50"
            }`}
          >
            <span className="block text-[11px] font-semibold">{phase.id}</span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded bg-slate-200">
              <span
                className="block h-1.5 bg-[var(--brand)]"
                style={{ width: `${phase.total ? (phase.done / phase.total) * 100 : 0}%` }}
              />
            </span>
          </button>
        ))}
      </div>

      {phases.map((phase) =>
        phase.id === expanded ? <PhaseDetail key={phase.id} phase={phase} /> : null,
      )}
    </section>
  );
}

function PhaseDetail({ phase }: { phase: EvaluatedPhase }) {
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-slate-900">
          {phase.id} · {phase.name}
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_CLASS[phase.status]}`}>
          {LIFECYCLE_STATUS_LABEL[phase.status]}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{phase.goal}</p>
      <p className="mt-1 text-xs text-slate-500">
        {phase.pmbok} · Entra: {phase.entry} · Sale: {phase.exit}
      </p>
      <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
        {phase.steps.map((step) => (
          <li key={step.id} className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">
                {step.id} · {step.name}
              </p>
              <p className="text-xs text-slate-600">{step.inOpenEvm}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_CLASS[step.status]}`}>
                {LIFECYCLE_STATUS_LABEL[step.status]}
              </span>
              {step.inProduct ? (
                <Link href={step.href} className="text-xs underline">
                  Abrir
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
