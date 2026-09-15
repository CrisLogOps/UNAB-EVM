import type { UserRole } from "./types";

export const NAV_BY_ROLE: Record<UserRole, { href: string; label: string; group: string; mobile?: number }[]> = {
  owner: [
    { href: "/demo", label: "Inicio", group: "hoy", mobile: 1 },
    { href: "/admin", label: "Administración", group: "hoy" },
    { href: "/users", label: "Personas", group: "personas", mobile: 3 },
    { href: "/profiles", label: "Puestos", group: "personas" },
    { href: "/teams", label: "En la obra", group: "personas" },
    { href: "/areas", label: "Áreas", group: "personas" },
    { href: "/tenant", label: "Empresa", group: "empresa" },
    { href: "/budget-approval", label: "Aprobar $", group: "dinero" },
  ],
  pmo: [
    { href: "/demo", label: "Inicio", group: "hoy", mobile: 2 },
    { href: "/projects", label: "Obras", group: "obra", mobile: 5 },
    { href: "/gantt", label: "Calendario", group: "obra", mobile: 7 },
    { href: "/budget-review", label: "Revisar $", group: "dinero" },
    { href: "/cuts", label: "Cortes", group: "obra" },
    { href: "/evidence", label: "Evidencias", group: "obra" },
    { href: "/progress", label: "Avance", group: "obra", mobile: 4 },
  ],
  admin_obra: [
    { href: "/demo", label: "Inicio", group: "hoy", mobile: 2 },
    { href: "/progress", label: "Avance", group: "obra", mobile: 4 },
  ],
  finance: [
    { href: "/demo", label: "Inicio", group: "hoy", mobile: 2 },
    { href: "/budget", label: "Presupuesto", group: "dinero" },
    { href: "/finance", label: "Pagos", group: "dinero" },
    { href: "/progress", label: "Avance", group: "obra", mobile: 4 },
  ],
  commercial: [
    { href: "/demo", label: "Inicio", group: "hoy", mobile: 2 },
    { href: "/clients", label: "Clientes", group: "obra" },
    { href: "/budget-approval", label: "Aprobar $", group: "dinero" },
    { href: "/progress", label: "Avance", group: "obra", mobile: 4 },
  ],
  warehouse: [
    { href: "/demo", label: "Inicio", group: "hoy", mobile: 2 },
    { href: "/progress", label: "Avance", group: "obra", mobile: 4 },
  ],
  oficina_tecnica: [
    { href: "/demo", label: "Inicio", group: "hoy", mobile: 2 },
    { href: "/evidence", label: "Evidencias", group: "obra" },
    { href: "/progress", label: "Avance", group: "obra", mobile: 4 },
  ],
  field: [
    { href: "/demo", label: "Inicio", group: "hoy", mobile: 2 },
    { href: "/progress", label: "Avance", group: "obra", mobile: 4 },
    { href: "/costs", label: "Gastos", group: "dinero", mobile: 6 },
  ],
  subcontractor: [
    { href: "/demo", label: "Inicio", group: "hoy", mobile: 2 },
    { href: "/progress", label: "Avance", group: "obra", mobile: 4 },
  ],
  viewer: [{ href: "/demo", label: "Inicio", group: "hoy", mobile: 2 }],
};

export function navForRole(role: UserRole) {
  return NAV_BY_ROLE[role];
}
