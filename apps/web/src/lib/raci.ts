import type { AtomicPermission, RaciMark, UserRole } from "./types";

/** Roles operativos de la matriz RACI (sin roles internos de sistema). */
export const RACI_ROLES: UserRole[] = [
  "owner",
  "pmo",
  "admin_obra",
  "finance",
  "commercial",
  "warehouse",
  "field",
  "subcontractor",
];

export const RACI_MATRIX: Record<AtomicPermission, Partial<Record<UserRole, RaciMark>>> = {
  "project:manager": {
    owner: "A",
    pmo: "R",
    admin_obra: "C",
    finance: "C",
    commercial: "A",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "project:staff": {
    owner: "R/A",
    pmo: "C",
    admin_obra: "I",
    finance: "I",
    commercial: "I",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "schedule:edit": {
    owner: "I/A",
    pmo: "R/A",
    admin_obra: "C",
    finance: "I",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "schedule:view": {
    owner: "I",
    pmo: "I",
    admin_obra: "I",
    finance: "I",
    commercial: "I",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "evidence:upload": {
    owner: "I",
    pmo: "R",
    admin_obra: "R",
    finance: "R",
    commercial: "R",
    warehouse: "R",
    oficina_tecnica: "R",
    field: "R",
    subcontractor: "R",
  },
  "evidence:approve": {
    owner: "I",
    pmo: "A",
    admin_obra: "R",
    finance: "I",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "cost:edit": {
    owner: "I",
    pmo: "C",
    admin_obra: "R/A",
    finance: "I",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "cost:approve": {
    owner: "A",
    pmo: "R",
    admin_obra: "C",
    finance: "I",
    commercial: "A",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "cost:view": {
    owner: "I",
    pmo: "I",
    admin_obra: "I",
    finance: "I",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "inventory:request": {
    owner: "I",
    pmo: "I",
    admin_obra: "C",
    finance: "I",
    warehouse: "C",
    field: "R",
    subcontractor: "R",
  },
  "inventory:dispatch": {
    owner: "I",
    pmo: "I",
    admin_obra: "I",
    finance: "I",
    warehouse: "R/A",
    field: "I",
    subcontractor: "I",
  },
  "user:manager": {
    owner: "R/A",
    pmo: "I",
    admin_obra: "I",
    finance: "I",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "tenant:settings": {
    owner: "R/A",
    pmo: "I",
    admin_obra: "I",
    finance: "I",
    commercial: "C",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "budget:propose": {
    owner: "I",
    pmo: "C",
    admin_obra: "C",
    finance: "R",
    commercial: "I",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "budget:counter": {
    owner: "I",
    pmo: "R",
    admin_obra: "C",
    finance: "C",
    commercial: "I",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
  "budget:approve": {
    owner: "A",
    pmo: "I",
    admin_obra: "I",
    finance: "C",
    commercial: "A",
    warehouse: "I",
    field: "I",
    subcontractor: "I",
  },
};

function marks(role: UserRole, permission: AtomicPermission): string {
  return RACI_MATRIX[permission][role] ?? "";
}

/** Ejecuta el trabajo (R o R/A). El Owner no ejecuta proyectos ni Gantt. */
export function canExecute(role: UserRole, permission: AtomicPermission): boolean {
  const mark = marks(role, permission);
  return mark === "R" || mark === "R/A";
}

/** Aprueba (A, R/A o I/A) sin ejecutar la carga operativa. */
export function canApprove(role: UserRole, permission: AtomicPermission): boolean {
  const mark = marks(role, permission);
  return mark === "A" || mark === "R/A" || mark === "I/A";
}

export function raciLabel(role: UserRole, permission: AtomicPermission): RaciMark | "—" {
  return (RACI_MATRIX[permission][role] as RaciMark | undefined) ?? "—";
}
