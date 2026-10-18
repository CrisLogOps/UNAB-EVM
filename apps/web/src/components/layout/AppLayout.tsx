"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import { OpenEvmMark } from "@/components/brand/OpenEvmMark";
import { BoundedSelect } from "@/components/forms/BoundedSelect";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ROLE_LABELS, NAV_GROUP_LABELS } from "@/lib/constants";
import { personLabel } from "@/lib/handover";
import { OPERATING_MODE_LABEL, resolveOperatingMode } from "@/lib/operating-mode";
import { HOME_HREF } from "@/lib/startup-flow";
import { useOrg } from "./OrgProvider";
import { useRoleContext } from "./RoleProvider";
import { OperatingModeSwitch } from "./OperatingModeSwitch";

const ENV_FOOTER =
  "OpenEVM · Ambiente local · rama Dev · Seminario de Grado UNAB · Uso académico";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant } = useRoleContext();
  const {
    visibleProjects,
    projectId,
    setProjectId,
    users,
    sessionUserId,
    setSessionUserId,
    nav,
    role,
    isIndividualMode,
    identity,
    signOut,
  } = useOrg();
  const [open, setOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const currentProject = visibleProjects.find((item) => item.id === projectId);
  const mode = resolveOperatingMode(tenant);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[var(--brand)]/40 print:hidden lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col bg-[var(--brand)] text-white transition-transform print:hidden lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
          <OpenEvmMark variant="light" subtitle="Cómo va la obra" />
          <button type="button" className="p-2 lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {(Object.keys(NAV_GROUP_LABELS) as Array<keyof typeof NAV_GROUP_LABELS>).map((group) => {
            const items = nav.filter((item) => item.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-white/45">
                  {NAV_GROUP_LABELS[group]}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`block rounded-lg px-3 py-2.5 text-sm ${
                          active
                            ? "bg-[var(--accent)] font-medium text-[var(--brand-dark)]"
                            : "text-white/85 hover:bg-white/10"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-72">
        <header
          className="sticky top-0 z-20 border-b border-zinc-200 bg-[var(--header)] px-3 py-2 print:hidden sm:px-4"
          style={{ paddingTop: "max(0.5rem, var(--safe-top))" }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="shrink-0 rounded-md border border-zinc-200 p-2 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 lg:hidden">
              <OpenEvmMark compact />
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
              <div className="flex min-w-0 max-w-[42vw] items-center gap-1.5 rounded-full bg-[var(--brand)] px-2 py-1 text-white sm:max-w-none sm:gap-2 sm:px-2.5">
                <UserRound className="h-4 w-4 shrink-0" />
                <span className="truncate text-xs sm:text-sm">
                  {identity?.name || ROLE_LABELS[role]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  router.replace("/login");
                }}
                className="shrink-0 rounded-md border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50 sm:text-xs"
              >
                Salir
              </button>
            </div>
          </div>

          <button
            type="button"
            className="mt-2 flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-left lg:hidden"
            aria-expanded={contextOpen}
            onClick={() => setContextOpen((value) => !value)}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-zinc-900">
                {currentProject?.name || "Sin proyecto"}
              </span>
              <span className="block truncate text-[11px] text-zinc-500">
                {tenant.name || "Empresa"}
                {mode ? ` · ${OPERATING_MODE_LABEL[mode]}` : ""}
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition ${contextOpen ? "rotate-180" : ""}`} />
          </button>

          <div
            className={`${contextOpen ? "mt-2 grid" : "hidden"} grid-cols-1 gap-2 sm:grid-cols-2 lg:mt-2 lg:grid ${
              isIndividualMode ? "xl:grid-cols-3" : "xl:grid-cols-4"
            }`}
          >
            <div className="block min-w-0">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500">Empresa</span>
              <BoundedSelect
                aria-label="Empresa actual"
                value={tenant.id}
                onChange={() => undefined}
                options={[{ value: tenant.id, label: tenant.name || "Nueva organización" }]}
              />
            </div>
            <div className="block min-w-0">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500">Proyecto</span>
              <BoundedSelect
                aria-label="Proyecto actual"
                value={projectId}
                onChange={setProjectId}
                options={
                  visibleProjects.length
                    ? visibleProjects.map((item) => ({ value: item.id, label: item.name }))
                    : [{ value: "", label: "Sin proyectos asignados" }]
                }
              />
            </div>
            <OperatingModeSwitch />
            {isIndividualMode ? null : (
            <div className="block min-w-0 sm:col-span-2 xl:col-span-1">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500">Ver como</span>
              <BoundedSelect
                aria-label="Persona de demostración"
                value={sessionUserId}
                onChange={(next) => {
                  setSessionUserId(next);
                  router.push(HOME_HREF);
                }}
                options={users
                  .filter((item) => item.active)
                  .map((item) => ({
                    value: item.id,
                    label: personLabel(item.name, item.role, Boolean(item.profileId)),
                  }))}
              />
            </div>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 py-4 pb-[calc(5.75rem+var(--safe-bottom))] sm:px-6 sm:py-6 lg:pb-6 print:p-0 print:pb-0">
          {children}
        </main>

        <footer className="hidden border-t border-zinc-200 bg-white px-4 py-3 text-center text-[11px] text-zinc-500 print:hidden sm:block sm:px-6 lg:mb-0">
          {ENV_FOOTER}
        </footer>
      </div>

      <MobileBottomNav />
    </div>
  );
}
