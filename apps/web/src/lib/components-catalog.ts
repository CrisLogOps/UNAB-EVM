import { canApprove, canExecute, raciLabel } from "./raci";
import type { NavGroup } from "./constants";
import type {
  ComponentMode,
  PlatformComponentId,
  AtomicPermission,
  UserRole,
} from "./types";

export interface PlatformComponent {
  id: PlatformComponentId;
  label: string;
  navLabel: string;
  href: string;
  description: string;
  permission: AtomicPermission;
  mode: ComponentMode;
  group: NavGroup;
  mobile?: number;
}

export interface NavItem {
  href: string;
  label: string;
  group: NavGroup;
  mobile?: number;
}

export const PLATFORM_COMPONENTS: PlatformComponent[] = [
  {
    id: "dashboard",
    label: "Inicio",
    navLabel: "Inicio",
    href: "/demo",
    description: "Qué falta en el ciclo F0–F7, el arranque de la obra y el valor ganado.",
    permission: "schedule:view",
    mode: "view",
    group: "hoy",
    mobile: 1,
  },
  {
    id: "tenant",
    label: "Datos de la empresa",
    navLabel: "Empresa",
    href: "/tenant",
    description: "Datos de la organización, firma electrónica, SII y ERP (antecedentes para versiones posteriores).",
    permission: "tenant:settings",
    mode: "execute",
    group: "hoy",
  },
  {
    id: "admin",
    label: "Administración",
    navLabel: "Administración",
    href: "/admin",
    description: "Personas, puestos y datos de la empresa.",
    permission: "user:manager",
    mode: "execute",
    group: "hoy",
  },
  {
    id: "users",
    label: "Personas",
    navLabel: "Usuarios",
    href: "/users",
    description: "Registra colaboradores con correo y clave, y asígnales un puesto.",
    permission: "user:manager",
    mode: "execute",
    group: "personas",
    mobile: 3,
  },
  {
    id: "areas",
    label: "Áreas de la empresa",
    navLabel: "Grupos",
    href: "/areas",
    description: "Activa solo las áreas que existan en tu empresa.",
    permission: "tenant:settings",
    mode: "execute",
    group: "personas",
  },
  {
    id: "profiles",
    label: "Puestos",
    navLabel: "Perfiles",
    href: "/profiles",
    description: "Qué puede hacer cada puesto.",
    permission: "user:manager",
    mode: "execute",
    group: "personas",
  },
  {
    id: "project_staff",
    label: "Quién está en la obra",
    navLabel: "Directorio",
    href: "/teams",
    description: "Elige quién trabaja en cada proyecto.",
    permission: "project:staff",
    mode: "execute",
    group: "personas",
  },
  {
    id: "clients",
    label: "Clientes y kickoff",
    navLabel: "Clientes",
    href: "/clients",
    description: "Registrar clientes, proyectos, propuesta inicial y validación de áreas.",
    permission: "project:manager",
    mode: "execute",
    group: "obra",
  },
  {
    id: "projects",
    label: "Obras",
    navLabel: "Obras",
    href: "/projects",
    description: "Crear y abrir proyectos.",
    permission: "project:manager",
    mode: "execute",
    group: "obra",
    mobile: 5,
  },
  {
    id: "gantt",
    label: "Cronograma",
    navLabel: "Cronograma",
    href: "/gantt",
    description: "Actividades y fechas de la obra.",
    permission: "schedule:edit",
    mode: "execute",
    group: "obra",
    mobile: 7,
  },
  {
    id: "progress",
    label: "Avance",
    navLabel: "Avance",
    href: "/progress",
    description: "Registrar avance con foto de terreno o documento de escritorio.",
    permission: "evidence:upload",
    mode: "execute",
    group: "obra",
    mobile: 4,
  },
  {
    id: "evidence",
    label: "Evidencias",
    navLabel: "Evidencias",
    href: "/evidence",
    description: "Revisar fotos y documentos antes de contar el avance.",
    permission: "evidence:approve",
    mode: "execute",
    group: "obra",
  },
  {
    id: "workbook",
    label: "Minutas",
    navLabel: "Minutas",
    href: "/minutas",
    description: "Instrucciones que mueven el gasto. El gasto entra al costo real y el adicional queda por cobrar.",
    permission: "evidence:upload",
    mode: "execute",
    group: "obra",
  },
  {
    id: "cuts",
    label: "Cortes",
    navLabel: "Cortes",
    href: "/cuts",
    description: "Cómo iba la obra en cada fecha de control.",
    permission: "schedule:edit",
    mode: "execute",
    group: "obra",
  },
  {
    id: "knowledge",
    label: "Base de conocimiento",
    navLabel: "Conocimiento",
    href: "/knowledge",
    description: "Registros de la empresa, el cliente y el proyecto, antes, durante y al cerrar. El cierre de un paquete queda aquí.",
    permission: "schedule:view",
    mode: "view",
    group: "obra",
  },
  {
    id: "budget_propose",
    label: "Presupuesto",
    navLabel: "Presupuesto",
    href: "/budget",
    description: "Finanzas carga el presupuesto de la obra.",
    permission: "budget:propose",
    mode: "execute",
    group: "dinero",
  },
  {
    id: "budget_counter",
    label: "Revisar presupuesto",
    navLabel: "Revisar $",
    href: "/budget-review",
    description: "El jefe de proyecto acepta o propone otro monto.",
    permission: "budget:counter",
    mode: "execute",
    group: "dinero",
  },
  {
    id: "budget_approve",
    label: "Aprobar presupuesto",
    navLabel: "Aprobar $",
    href: "/budget-approval",
    description: "El administrador o comercial da el cierre.",
    permission: "budget:approve",
    mode: "approve",
    group: "dinero",
  },
  {
    id: "costs",
    label: "Gastos del día",
    navLabel: "Gastos",
    href: "/costs",
    description: "Anotar un gasto de la obra. Queda como minuta y entra al costo real.",
    permission: "cost:edit",
    mode: "execute",
    group: "dinero",
    mobile: 6,
  },
  {
    id: "finance_ep",
    label: "Pagos",
    navLabel: "Pagos",
    href: "/finance",
    description: "Estados de pago.",
    permission: "budget:propose",
    mode: "execute",
    group: "dinero",
  },
];

export function roleMayAttachComponent(role: UserRole, component: PlatformComponent): boolean {
  const mark = raciLabel(role, component.permission);
  if (mark === "—") return false;
  if (component.mode === "execute") return canExecute(role, component.permission);
  if (component.mode === "approve") return canApprove(role, component.permission);
  return true;
}

export function allowedComponentsForRole(role: UserRole): PlatformComponent[] {
  return PLATFORM_COMPONENTS.filter((item) => roleMayAttachComponent(role, item));
}

export function defaultComponentIds(role: UserRole): PlatformComponentId[] {
  return allowedComponentsForRole(role).map((item) => item.id);
}

export function navFromComponentIds(ids: PlatformComponentId[]): NavItem[] {
  const selected = new Set(ids);
  const seen = new Set<string>();
  return PLATFORM_COMPONENTS.filter((item) => selected.has(item.id)).flatMap((item) => {
    if (seen.has(item.href)) return [];
    seen.add(item.href);
    return [
      {
        href: item.href,
        label: item.navLabel,
        group: item.group,
        mobile: item.mobile,
      },
    ];
  });
}

export function componentById(id: PlatformComponentId) {
  return PLATFORM_COMPONENTS.find((item) => item.id === id);
}
