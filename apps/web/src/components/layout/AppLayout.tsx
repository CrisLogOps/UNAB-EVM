"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, UserRound, X } from "lucide-react";
import { OpenEvmMark } from "@/components/brand/OpenEvmMark";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ROLE_LABELS, NAV_GROUP_LABELS } from "@/lib/constants";
import { personLabel } from "@/lib/handover";
import { HOME_HREF } from "@/lib/startup-flow";
import { useOrg } from "./OrgProvider";
import { useRoleContext } from "./RoleProvider";

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
  } = useOrg();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[var(--brand)]/40 lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col bg-[var(--brand)] text-white transition-transform lg:translate-x-0 ${
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
          className="sticky top-0 z-20 border-b border-zinc-200 bg-[var(--header)] px-3 py-2 sm:px-4"
          style={{ paddingTop: "max(0.5rem, var(--safe-top))" }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-200 p-2 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 lg:hidden">
              <OpenEvmMark />
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-full bg-[var(--brand)] px-2.5 py-1 text-white">
              <UserRound className="h-4 w-4 shrink-0" />
              <span className="max-w-[7.5rem] truncate text-xs sm:max-w-[9rem] sm:text-sm">
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <label className="block min-w-0">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500">Empresa</span>
              <select
                className="w-full min-w-0 truncate rounded-md border border-zinc-200 bg-white px-2 py-2"
                defaultValue={tenant.id}
                aria-label="Empresa actual"
              >
                <option value={tenant.id}>{tenant.name || "Nueva organización"}</option>
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500">Proyecto</span>
              <select
                className="w-full min-w-0 truncate rounded-md border border-zinc-200 bg-white px-2 py-2"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                aria-label="Proyecto actual"
              >
                {visibleProjects.length ? (
                  visibleProjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))
                ) : (
                  <option value="">Sin proyectos asignados</option>
                )}
              </select>
            </label>
            <label className="block min-w-0 sm:col-span-2 xl:col-span-1">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500">Ver como</span>
              <select
                className="w-full min-w-0 truncate rounded-md border border-zinc-200 bg-white px-2 py-2"
                value={sessionUserId}
                onChange={(event) => {
                  setSessionUserId(event.target.value);
                  router.push(HOME_HREF);
                }}
                aria-label="Persona de demostración"
              >
                {users
                  .filter((item) => item.active)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {personLabel(item.name, item.role, Boolean(item.profileId))}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 py-4 pb-24 sm:px-6 sm:py-6 lg:pb-6">{children}</main>

        <footer className="hidden border-t border-zinc-200 bg-white px-4 py-3 text-center text-[11px] text-zinc-500 sm:block sm:px-6 lg:mb-0">
          {ENV_FOOTER}
        </footer>
      </div>

      <MobileBottomNav />
    </div>
  );
}
