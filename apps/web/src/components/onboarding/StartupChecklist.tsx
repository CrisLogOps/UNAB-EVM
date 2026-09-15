"use client";

import Link from "next/link";
import { Check, Circle, Lock } from "lucide-react";
import { useMemo } from "react";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { teamCoverageMode } from "@/lib/coverage";
import { buildStartupFlow } from "@/lib/startup-flow";

export function StartupChecklist({ compact = false }: { compact?: boolean }) {
  const {
    tenant,
    clients,
    projects,
    project,
    kickoffFor,
    gantt,
    assignments,
    users,
    sessionUser,
    areas,
    role,
    ownerManagesAll,
    canOperate,
  } = useOrg();

  const flow = useMemo(
    () =>
      buildStartupFlow({
        companySize: tenant.companySize,
        coverageMode: teamCoverageMode(users),
        ownerManagesAll,
        role,
        sessionUser,
        clients,
        projects,
        project,
        kickoff: project.id === "prj-pending" ? undefined : kickoffFor(project.id),
        areas,
        scheduleCount: gantt.filter((item) => item.projectId === project.id).length,
        assignmentCount: assignments.filter((item) => item.projectId === project.id).length,
        users,
        canOperate,
      }),
    [
      tenant.companySize,
      users,
      ownerManagesAll,
      role,
      sessionUser,
      clients,
      projects,
      project,
      kickoffFor,
      areas,
      gantt,
      assignments,
      canOperate,
    ],
  );

  const pending = flow.steps.filter((item) => !item.done).length;

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 sm:p-5">
      <p className="text-xs uppercase tracking-wide text-sky-800">{flow.roleTitle}</p>
      <h2 className="mt-1 text-lg font-semibold text-sky-950 sm:text-xl">{flow.headline}</h2>
      {compact ? null : <p className="mt-1 max-w-3xl text-sm text-sky-900">{flow.context}</p>}
      <p className="mt-2 text-xs text-sky-800">
        {pending
          ? compact
            ? "Solo el paso actual. El resto aparece cuando toque."
            : `${pending} dato${pending === 1 ? "" : "s"} pendiente${pending === 1 ? "" : "s"} para el control del proyecto.`
          : "Cliente, kickoff, presupuesto y calendario están listos."}
      </p>

      <ol className="mt-4 space-y-2">
        {flow.steps
          .filter((step) => (compact ? step.current : true))
          .map((step, index) => {
          const state = step.done ? "done" : step.current ? "current" : "later";
          return (
            <li
              key={step.id}
              className={`flex gap-3 rounded-xl border px-3 py-3 ${
                state === "done"
                  ? "border-emerald-200 bg-white text-emerald-950"
                  : state === "current"
                    ? "border-sky-400 bg-white shadow-sm"
                    : "border-transparent bg-white/60 text-slate-500"
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {state === "done" ? (
                  <Check className="h-5 w-5 text-emerald-600" />
                ) : state === "current" ? (
                  <Circle className="h-5 w-5 fill-sky-600 text-sky-600" />
                ) : (
                  <Lock className="h-5 w-5 text-slate-300" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">
                    {index + 1}. {step.code} · {step.title}
                  </span>
                  {state === "done" ? (
                    <span className="text-xs font-medium text-emerald-700">Listo</span>
                  ) : null}
                </span>
                {compact && state !== "current" ? null : (
                  <span className="mt-0.5 block text-sm text-slate-600">{step.detail}</span>
                )}
                {state === "current" ? (
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    {step.yours ? (
                      <Link
                        href={step.href}
                        className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-sm text-white hover:bg-[var(--brand-dark)]"
                      >
                        {step.actionLabel}
                      </Link>
                    ) : (
                      <span className="rounded-md bg-amber-50 px-3 py-1.5 text-sm text-amber-950">
                        Espera a {step.waitingOn}
                      </span>
                    )}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>

      {flow.next && !flow.next.yours ? (
        <p className="mt-3 text-xs text-slate-600">
          Este perfil ({ROLE_LABELS[role]}) no carga ese dato. Cambia «Ver como» o espera a {flow.next.waitingOn}.
        </p>
      ) : null}
    </section>
  );
}
