"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOrg } from "@/components/layout/OrgProvider";
import { HOME_HREF } from "@/lib/startup-flow";
import {
  OPERATING_MODE_LABEL,
  OPERATING_MODE_OPTIONS,
  canReturnToIndividual,
  extraCollaborators,
  resolveOperatingMode,
  type OperatingMode,
} from "@/lib/operating-mode";

const COLLAB_ONLY_HREFS = ["/admin", "/users", "/profiles", "/areas", "/teams"];

export function OperatingModeSwitch({ variant = "toolbar" }: { variant?: "toolbar" | "panel" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant, switchOperatingMode, role, users } = useOrg();
  const current = resolveOperatingMode(tenant);
  const canSwitch = role === "owner";
  const extraPeople = extraCollaborators(users).length;
  const individualLocked = extraPeople > 0;
  const canGoIndividual = canReturnToIndividual(users);

  function apply(next: OperatingMode) {
    if (!canSwitch || next === current) return;
    if (next === "individual" && !canGoIndividual) return;
    const leavingCollab = current === "collaborative" && next === "individual";
    const message = leavingCollab
      ? "Se ocultan Personas, Puestos y Áreas. El flujo de la obra se mantiene y lo cubres tú."
      : "Se abren Personas, Puestos y Áreas con puestos listos para invitar. El modo colaborativo pide 2 o más usuarios. Si invitas a alguien, ya no podrás volver a individual hasta quitar a todos los colaboradores.";
    if (!window.confirm(message)) return;
    switchOperatingMode(next);
    if (next === "individual" && COLLAB_ONLY_HREFS.includes(pathname)) {
      router.push(HOME_HREF);
    }
  }

  if (variant === "toolbar") {
    return (
      <div className="block min-w-0">
        <span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500">Modo</span>
        <div className="grid grid-cols-2 overflow-hidden rounded-md border border-zinc-200 bg-white">
          {OPERATING_MODE_OPTIONS.map((item) => {
            const active = current === item.id;
            const blocked = item.id === "individual" && individualLocked;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!canSwitch || blocked}
                title={
                  blocked
                    ? "Hay colaboradores. Quítalos en Personas para volver a individual."
                    : OPERATING_MODE_LABEL[item.id]
                }
                onClick={() => apply(item.id)}
                className={`min-w-0 truncate px-2 py-2 text-xs sm:text-sm ${
                  active
                    ? "bg-[var(--brand)] font-semibold text-white"
                    : blocked
                      ? "cursor-not-allowed text-zinc-400"
                      : "text-zinc-600 hover:bg-zinc-50 disabled:opacity-60"
                }`}
              >
                {OPERATING_MODE_LABEL[item.id]}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">Cómo trabajas</p>
      <h2 className="mt-1 text-lg font-semibold">Modo de la plataforma</h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Individual y colaborativo sirven para evaluar ambos recorridos. El proceso F1–F7 no cambia. Con el
        primer usuario adicional el modo individual se bloquea hasta que el equipo vuelva a ser solo tú.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {OPERATING_MODE_OPTIONS.map((item) => {
          const active = current === item.id;
          const blocked = item.id === "individual" && individualLocked;
          return (
            <button
              key={item.id}
              type="button"
              disabled={!canSwitch || blocked}
              title={
                blocked
                  ? "Hay colaboradores. Quítalos en Personas para volver a individual."
                  : undefined
              }
              onClick={() => apply(item.id)}
              className={`rounded-xl border p-3 text-left ${
                active ? "border-[var(--brand)] bg-slate-50" : "border-slate-200 hover:border-slate-300"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.subtitle}</p>
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-xs text-slate-600">{item.howItWorks}</p>
              {blocked ? (
                <p className="mt-2 text-xs font-medium text-amber-800">
                  No disponible: hay {extraPeople} colaborador{extraPeople === 1 ? "" : "es"}. Quítalos
                  en Personas para volver.
                </p>
              ) : active ? (
                <p className="mt-2 text-xs font-medium text-[var(--brand)]">Modo activo</p>
              ) : (
                <p className="mt-2 text-xs font-medium text-slate-500">Cambiar a este modo</p>
              )}
            </button>
          );
        })}
      </div>
      {current === "collaborative" && extraPeople < 1 ? (
        <p className="mt-3 text-sm text-amber-800">
          Aún eres el único usuario. Invita a alguien en Personas. Mientras no haya colaboradores puedes
          volver a individual.
        </p>
      ) : null}
    </section>
  );
}
