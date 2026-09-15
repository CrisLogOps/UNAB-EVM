import { ROLE_LABELS } from "./constants";
import { PLATFORM_COMPONENTS } from "./components-catalog";
import type {
  AtomicPermission,
  OrgProfile,
  PlatformComponentId,
  TenantUser,
  UserRole,
} from "./types";

export interface CoverageTask {
  id: string;
  permission: AtomicPermission;
  componentId: PlatformComponentId;
  label: string;
  detail: string;
  vacantRole: UserRole;
}

/** Tareas ejecutables que se pueden cubrir sin entregar el perfil dueño. Nunca incluyen validación. */
export const DELEGABLE_TASKS: CoverageTask[] = [
  {
    id: "task-budget-load",
    permission: "budget:propose",
    componentId: "budget_propose",
    label: "Cargar presupuesto",
    detail: "Propone el monto. El administrador da el visto bueno; esta persona no valida.",
    vacantRole: "finance",
  },
  {
    id: "task-progress",
    permission: "evidence:upload",
    componentId: "progress",
    label: "Cargar avance y evidencia",
    detail: "Registra el avance con foto de faena o documento de escritorio, según el cronograma.",
    vacantRole: "field",
  },
  {
    id: "task-costs",
    permission: "cost:edit",
    componentId: "costs",
    label: "Anotar gastos del día",
    detail: "Carga gastos de faena. No cierra el presupuesto.",
    vacantRole: "field",
  },
  {
    id: "task-payments",
    permission: "budget:propose",
    componentId: "finance_ep",
    label: "Registrar pagos",
    detail: "Estados de pago. Si hay Finanzas, esa persona los carga; si no, se puede cubrir desde otro puesto.",
    vacantRole: "finance",
  },
];

export const NEVER_DELEGABLE: AtomicPermission[] = [
  "budget:approve",
  "user:manager",
  "tenant:settings",
];

export type TeamCoverageMode = "solo" | "counterpart" | "escalated";

export function assignedRoles(users: TenantUser[]): Set<UserRole> {
  const roles = new Set<UserRole>();
  users.forEach((user) => {
    if (user.active && user.profileId && user.role !== "viewer") {
      roles.add(user.role);
    }
  });
  return roles;
}

export function activeStaff(users: TenantUser[]): TenantUser[] {
  return users.filter((user) => user.active && user.profileId);
}

export function teamCoverageMode(users: TenantUser[]): TeamCoverageMode {
  const staff = activeStaff(users);
  if (staff.length <= 1) return "solo";
  const roles = assignedRoles(users);
  if (staff.length === 2 && roles.has("owner") && roles.has("pmo")) return "counterpart";
  return "escalated";
}

/** A quién responde cada perfil. Terreno → PM → Administrador. Finanzas/comercial validan con el admin. */
export function reportsToRole(role: UserRole): UserRole | null {
  if (role === "owner") return null;
  if (role === "pmo" || role === "finance" || role === "commercial") return "owner";
  return "pmo";
}

export function reportsToName(role: UserRole, users: TenantUser[]): string {
  const parent = reportsToRole(role);
  if (!parent) return "";
  const person = users.find((item) => item.active && item.profileId && item.role === parent);
  if (person) return person.name;
  if (parent === "pmo") {
    const owner = users.find((item) => item.active && item.role === "owner");
    return owner?.name ? `${ROLE_LABELS.pmo} (vacante) · ${owner.name}` : ROLE_LABELS.pmo;
  }
  const owner = users.find((item) => item.active && item.role === "owner");
  return owner?.name || ROLE_LABELS.owner;
}

export function escalationPath(role: UserRole): UserRole[] {
  const path: UserRole[] = [role];
  let current: UserRole | null = role;
  const seen = new Set<UserRole>([role]);
  while (current) {
    const parent = reportsToRole(current);
    if (!parent || seen.has(parent)) break;
    path.push(parent);
    seen.add(parent);
    current = parent;
  }
  return path;
}

export function escalationPathLabel(role: UserRole): string {
  return escalationPath(role)
    .map((item) => ROLE_LABELS[item])
    .join(" → ");
}

function vacantRoles(users: TenantUser[]): Set<UserRole> {
  const taken = assignedRoles(users);
  const vacant = new Set<UserRole>();
  DELEGABLE_TASKS.forEach((task) => {
    if (!taken.has(task.vacantRole)) vacant.add(task.vacantRole);
  });
  return vacant;
}

export function autoCoverageTasks(role: UserRole, users: TenantUser[]): CoverageTask[] {
  if (role === "owner") return [];
  const vacant = vacantRoles(users);
  const mode = teamCoverageMode(users);
  return DELEGABLE_TASKS.filter((task) => {
    if (!vacant.has(task.vacantRole)) return false;
    if (mode === "counterpart" && role === "pmo") return true;
    if (mode === "escalated" && role === "pmo" && task.vacantRole !== "finance") {
      return reportsToRole(task.vacantRole) === "pmo";
    }
    return false;
  });
}

export function coverageTasksForProfile(profile: OrgProfile, users: TenantUser[]): CoverageTask[] {
  const vacant = vacantRoles(users);
  const auto = autoCoverageTasks(profile.role, users);
  const extras = DELEGABLE_TASKS.filter(
    (task) =>
      (profile.extraTaskIds ?? []).includes(task.id) &&
      vacant.has(task.vacantRole) &&
      !auto.some((item) => item.id === task.id),
  );
  return [...auto, ...extras];
}

export function extraPermissionsForRole(
  role: UserRole,
  users: TenantUser[],
  profiles: OrgProfile[],
): AtomicPermission[] {
  const perms = new Set<AtomicPermission>();
  profiles
    .filter((item) => item.role === role)
    .forEach((profile) => {
      coverageTasksForProfile(profile, users).forEach((task) => perms.add(task.permission));
    });
  return [...perms];
}

export function extraComponentIdsForRole(
  role: UserRole,
  users: TenantUser[],
  profiles: OrgProfile[],
): PlatformComponentId[] {
  const ids = new Set<PlatformComponentId>();
  profiles
    .filter((item) => item.role === role)
    .forEach((profile) => {
      coverageTasksForProfile(profile, users).forEach((task) => ids.add(task.componentId));
    });
  return [...ids];
}

/** Permisos de ejecución que ya cubre otro perfil: el administrador no los edita. */
export function ownerBlockedPermissions(users: TenantUser[], profiles: OrgProfile[]): AtomicPermission[] {
  const blocked = new Set<AtomicPermission>();
  profiles.forEach((profile) => {
    if (profile.role === "owner") return;
    coverageTasksForProfile(profile, users).forEach((task) => blocked.add(task.permission));
  });
  return [...blocked];
}

export function componentIdsForPermissions(permissions: AtomicPermission[]): PlatformComponentId[] {
  const allowed = new Set(permissions);
  return PLATFORM_COMPONENTS.filter((item) => allowed.has(item.permission)).map((item) => item.id);
}

export function coverageModeCopy(mode: TeamCoverageMode): { title: string; text: string } {
  if (mode === "solo") {
    return {
      title: "Tú cubres todo",
      text: "Todavía no hay otro perfil en uso. El administrador ejecuta y valida. Al sumar un gestor de proyectos, se parte la contraparte sola.",
    };
  }
  if (mode === "counterpart") {
    return {
      title: "Equipo de 2: contraparte automática",
      text: "El gerente de proyectos ejecuta (obras, calendario y tareas vacantes como cargar presupuesto). El administrador valida y no edita ese trabajo.",
    };
  }
  return {
    title: "Equipo de 3 o más: escala por perfil",
    text: "Terreno envía al jefe de proyecto; el jefe responde al administrador. Las validaciones (visto bueno) quedan en el administrador. Finanzas, si no hay persona, no se mezcla con el PM.",
  };
}
