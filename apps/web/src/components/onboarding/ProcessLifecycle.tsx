"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useOrg } from "@/components/layout/OrgProvider";
import { isIndividualMode } from "@/lib/operating-mode";
import {
  BOOK_DECISION_IDS,
  BOOK_STEP_COUNT,
  LIFECYCLE_STATUS_LABEL,
  PROCESS_SOURCE,
  evaluateProcessLifecycle,
  type EvaluatedPhase,
  type EvaluatedStep,
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
        independent: isIndividualMode(tenant),
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
      tenant.operatingMode,
    ],
  );
  const current = phases.find((item) => item.status === "current" || item.status === "partial") ?? phases[0];
  const [openId, setOpenId] = useState<string | null>(null);
  const expanded = openId;
  const bookPhases = phases.filter((item) => item.id !== "F0");
  const bookDone = bookPhases.reduce((sum, item) => sum + item.done, 0);
  const testReady = bookPhases.reduce((sum, item) => sum + item.testReady, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">Flujo válido del proyecto · Rev3</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">{PROCESS_SOURCE.title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        {BOOK_STEP_COUNT} pasos del libro (F1–F7), más el alta de tenant (F0). F4 y F5 corren en paralelo. Los
        módulos que aún no se pueden probar siguen en el flujo: son la base PMBOK de la plataforma.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {bookDone} de {BOOK_STEP_COUNT} pasos del flujo en esta obra · {testReady} con pantalla de prueba ·{" "}
        {BOOK_DECISION_IDS.length} puntos de decisión. Fuente: {PROCESS_SOURCE.file}.
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2 lg:grid-cols-8">
        {phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            onClick={() => setOpenId((currentId) => (currentId === phase.id ? null : phase.id))}
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
            <span className="mt-1 block text-[10px] text-slate-500">
              {phase.done}/{phase.total}
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
          <StepRow key={step.id} step={step} />
        ))}
      </ul>
    </div>
  );
}

function StepRow({ step }: { step: EvaluatedStep }) {
  const graph =
    step.predecessor.length || step.successor.length
      ? `${step.predecessor.join(" / ") || "inicio"} → ${step.id} → ${step.successor.join(" / ") || "fin"}`
      : null;
  return (
    <li className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">
          {step.id} · {step.name}
          {step.decision ? (
            <span className="ml-2 rounded border border-rose-300 px-1.5 py-0.5 text-[10px] font-medium text-rose-800">
              Decisión
            </span>
          ) : null}
        </p>
        <p className="text-xs text-slate-600">{step.inOpenEvm}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {step.knowledgeArea} · {step.responsible}
          {graph ? ` · ${graph}` : ""}
        </p>
        {step.decision && step.bifurcation ? (
          <p className="mt-1 text-[11px] text-rose-800">{step.bifurcation}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_CLASS[step.status]}`}>
          {LIFECYCLE_STATUS_LABEL[step.status]}
        </span>
        {step.readyForTest ? (
          <Link href={step.href} className="text-xs underline">
            Probar
          </Link>
        ) : (
          <span className="text-[11px] text-slate-400">Pendiente</span>
        )}
      </div>
    </li>
  );
}
