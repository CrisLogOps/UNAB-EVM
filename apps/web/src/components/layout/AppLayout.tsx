"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import { OpenEvmMark } from "@/components/brand/OpenEvmMark";
import { BoundedSelect } from "@/components/forms/BoundedSelect";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ROLE_LABELS, NAV_GROUP_LABELS, type NavGroup } from "@/lib/constants";
import { personLabel } from "@/lib/handover";
import { appChannel, OPERATING_MODE_LABEL, resolveOperatingMode } from "@/lib/operating-mode";
import { HOME_HREF } from "@/lib/startup-flow";
import { useOrg } from "./OrgProvider";
import { useRoleContext } from "./RoleProvider";
import { OperatingModeSwitch } from "./OperatingModeSwitch";

const ENV_FOOTER =
  appChannel() === "staging"
    ? "OpenEVM · Staging · Seminario de Grado UNAB · Uso académico"
    : process.env.NODE_ENV === "development"
      ? "OpenEVM · Ambiente local · rama Dev · Seminario de Grado UNAB · Uso académico"
      : "OpenEVM · Ambiente de desarrollo · rama Dev · Seminario de Grado UNAB · Uso académico";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant } = useRoleContext();
  const {
    clients,
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
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const activeGroup = nav.find((item) => item.href === pathname)?.group ?? null;
  const [openGroups, setOpenGroups] = useState<NavGroup[]>(activeGroup ? [activeGroup] : []);
  const menuReady = useRef(Boolean(activeGroup));
  if (!menuReady.current && activeGroup) {
    menuReady.current = true;
    setOpenGroups((groups) => (groups.includes(activeGroup) ? groups : [activeGroup, ...groups]));
  }
  const [menuPath, setMenuPath] = useState(pathname);
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    if (activeGroup && !openGroups.includes(activeGroup)) {
      setOpenGroups((groups) => [...groups, activeGroup]);
    }
  }
  const previewClientId = pathname.startsWith("/cliente") ? (searchParams.get("id") ?? "") : "";
  const previewClient = clients.find((item) => item.id === previewClientId);
  const headerProjects = previewClient
    ? visibleProjects.filter((item) => item.clientId === previewClient.id && item.id !== "prj-pending")
    : visibleProjects;
  const currentProject = headerProjects.find((item) => item.id === projectId) ?? headerProjects[0];
  const mode = resolveOperatingMode(tenant);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[var(--brand)]/40 print:hidden md:hidden"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col bg-[var(--brand)] text-white transition-transform print:hidden md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-4">
          <OpenEvmMark variant="light" subtitle="Cómo va la obra" />
          <button type="button" className="p-2 md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {(Object.keys(NAV_GROUP_LABELS) as NavGroup[]).map((group) => {
            const items = nav.filter((item) => item.group === group);
            if (!items.length) return null;
            const expanded = openGroups.includes(group);
            return (
              <div key={group}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() =>
                    setOpenGroups((current) =>
                      current.includes(group) ? current.filter((item) => item !== group) : [...current, group],
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-white/70 hover:bg-white/10"
                >
                  {NAV_GROUP_LABELS[group]}
                  <ChevronDown className={`h-4 w-4 shrink-0 transition ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded ? (
                  <div className="space-y-1 pb-2">
                    {items.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`block rounded-lg py-2 pl-6 pr-3 text-sm ${
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
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col md:pl-72">
        <header
          className="sticky top-0 z-20 border-b border-zinc-200 bg-[var(--header)] px-3 py-2 print:hidden sm:px-4"
          style={{ paddingTop: "max(0.5rem, var(--safe-top))" }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="shrink-0 rounded-md border border-zinc-200 p-2 md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 md:hidden">
              <OpenEvmMark compact />
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
              <div className="flex min-w-0 max-w-[42vw] items-center gap-1.5 rounded-full bg-[var(--brand)] px-2 py-1 text-white sm:max-w-none sm:gap-2 sm:px-2.5">
                <UserRound className="h-4 w-4 shrink-0" />
                <span className="truncate text-xs sm:text-sm">
                  {previewClient ? previewClient.name : identity?.name || ROLE_LABELS[role]}
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
            className="mt-2 flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-left md:hidden"
            aria-expanded={contextOpen}
            onClick={() => setContextOpen((value) => !value)}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-zinc-900">
                {currentProject?.name || "Sin proyecto"}
              </span>
              <span className="block truncate text-[11px] text-zinc-500">
                {previewClient
                  ? "Vista del cliente"
                  : `${tenant.name || "Empresa"}${mode ? ` · ${OPERATING_MODE_LABEL[mode]}` : ""}`}
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition ${contextOpen ? "rotate-180" : ""}`} />
          </button>

          <div
            className={`${contextOpen ? "mt-2 grid" : "hidden"} grid-cols-1 gap-2 sm:grid-cols-2 md:mt-2 md:grid ${
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
                value={headerProjects.some((item) => item.id === projectId) ? projectId : (headerProjects[0]?.id ?? "")}
                onChange={(next) => {
                  setProjectId(next);
                  if (previewClient) router.push(`/cliente?id=${previewClient.id}&obra=${next}`);
                }}
                options={
                  headerProjects.length
                    ? headerProjects.map((item) => ({ value: item.id, label: item.name }))
                    : [{ value: "", label: previewClient ? "Sin obras de este cliente" : "Sin proyectos asignados" }]
                }
              />
            </div>
            {previewClient ? null : <OperatingModeSwitch />}
            {isIndividualMode || previewClient ? null : (
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

        <main className="min-w-0 flex-1 px-3 py-4 pb-[calc(5.75rem+var(--safe-bottom))] sm:px-6 sm:py-6 md:pb-6 print:p-0 print:pb-0">
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
