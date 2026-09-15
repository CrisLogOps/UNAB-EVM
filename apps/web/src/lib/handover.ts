import { canApprove, canExecute } from "./raci";
import { ROLE_LABELS } from "./constants";
import type { AtomicPermission, TenantUser, UserRole } from "./types";

/** Qué deja de editar el administrador al entregar cada puesto. */
export const ROLE_HANDOVER_SCOPE: Partial<Record<UserRole, string>> = {
  pmo: "obras, calendario y revisión de presupuesto",
  finance: "carga de presupuesto y pagos",
  commercial: "clientes y el cierre comercial, junto al administrador",
  field: "avance, evidencias y gastos de terreno",
  admin_obra: "el día a día en faena",
  warehouse: "bodega y despachos",
  subcontractor: "el avance de su partida",
  oficina_tecnica: "partidas y evidencias",
};

/** Permisos que el administrador deja de editar al entregar ese puesto. */
export const ROLE_EXECUTE_PERMISSIONS: Partial<Record<UserRole, AtomicPermission[]>> = {
  pmo: ["project:manager", "schedule:edit", "budget:counter", "evidence:approve"],
  finance: ["budget:propose"],
  field: ["evidence:upload", "cost:edit", "inventory:request"],
  admin_obra: ["cost:edit"],
  warehouse: ["inventory:dispatch"],
  subcontractor: ["evidence:upload"],
  oficina_tecnica: ["evidence:approve"],
};

export function handedRoles(users: TenantUser[]): UserRole[] {
  const roles = new Set<UserRole>();
  users.forEach((user) => {
    if (user.active && user.profileId && user.role !== "owner" && user.role !== "viewer") {
      roles.add(user.role);
    }
  });
  return [...roles];
}

export function coveringRoles(permission: AtomicPermission): UserRole[] {
  return (Object.entries(ROLE_EXECUTE_PERMISSIONS) as [UserRole, AtomicPermission[]][])
    .filter(([, perms]) => perms.includes(permission))
    .map(([role]) => role);
}

export function isFirstOfRole(users: TenantUser[], role: UserRole): boolean {
  return !users.some(
    (user) => user.active && user.profileId && user.role === role && user.role !== "owner",
  );
}

export function ownerCanOperate(permission: AtomicPermission, handed: UserRole[]): boolean {
  return !coveringRoles(permission).some((role) => handed.includes(role));
}

export function canOperateAs(
  role: UserRole,
  permission: AtomicPermission,
  handed: UserRole[],
  extras: AtomicPermission[] = [],
  blockedForOwner: AtomicPermission[] = [],
): boolean {
  if (role === "owner") {
    if (blockedForOwner.includes(permission)) return false;
    return ownerCanOperate(permission, handed);
  }
  if (extras.includes(permission)) return true;
  const owned = ROLE_EXECUTE_PERMISSIONS[role] ?? [];
  if (owned.includes(permission)) return true;
  return canExecute(role, permission) || canApprove(role, permission);
}

export function handoverWarning(role: UserRole): string {
  const scope = ROLE_HANDOVER_SCOPE[role] ?? "esa parte de la gestión";
  const puesto = ROLE_LABELS[role];
  return `Al entregar el perfil de ${puesto}, tus permisos se recortan de forma obligatoria: podrás ver ${scope}, pero no editar el trabajo de esa persona.`;
}

export function personLabel(name: string, role: UserRole, hasProfile: boolean): string {
  const puesto = hasProfile ? ROLE_LABELS[role] : "Sin puesto";
  return `${name.trim() || "Sin nombre"} · ${puesto}`;
}
