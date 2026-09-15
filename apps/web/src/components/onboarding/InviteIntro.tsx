"use client";

import { useRouter } from "next/navigation";
import { OpenEvmMark } from "@/components/brand/OpenEvmMark";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { ROLE_GUIDE } from "@/lib/raci-guide";
import { HOME_HREF } from "@/lib/startup-flow";
import { coverageTasksForProfile, escalationPathLabel, reportsToName } from "@/lib/coverage";

export function InviteIntro() {
  const { sessionUser, sessionProfile, markIntroSeen, tenant, project, nav, users } = useOrg();
  const router = useRouter();
  const guide = ROLE_GUIDE[sessionUser.role];
  const landing = HOME_HREF;
  const puesto = sessionProfile?.name ?? ROLE_LABELS[sessionUser.role];
  const tasks = sessionProfile ? coverageTasksForProfile(sessionProfile, users) : [];

  return (
    <div className="min-h-screen bg-[var(--brand)] text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8 sm:px-6">
        <OpenEvmMark variant="light" subtitle="Bienvenida" />
        <div className="mt-8 flex-1 rounded-2xl bg-white p-6 text-[var(--foreground)] shadow-xl">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {tenant.name} · {project.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Hola, {sessionUser.name || sessionUser.email}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Te asignaron el perfil <strong>{puesto}</strong>. Empiezas en <strong>Inicio</strong>: ves
            qué datos del proyecto faltan (cliente, kickoff, presupuesto, calendario) y qué te toca
            completar. Reportas a{" "}
            <strong>{reportsToName(sessionUser.role, users) || "Administrador"}</strong>
            {sessionUser.role !== "owner" ? ` (${escalationPathLabel(sessionUser.role)})` : null}.
          </p>

          <section className="mt-5 rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold">{guide.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{guide.summary}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Esto es lo que harás</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              {guide.duties.map((item) => (
                <li key={item}>{item}</li>
              ))}
              {tasks.map((item) => (
                <li key={item.id}>{item.label} (cobertura, sin validar)</li>
              ))}
            </ul>
          </section>

          <section className="mt-4">
            <h2 className="text-sm font-semibold">En tu menú</h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {nav.map((item) => (
                <li key={item.href} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  {item.label}
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => {
                markIntroSeen(sessionUser.id);
                router.push(landing);
              }}
              className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
            >
              Entendido, entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
