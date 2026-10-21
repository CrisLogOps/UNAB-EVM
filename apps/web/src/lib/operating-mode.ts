import type { NavItem } from "./components-catalog";
import type { CompanySize, OperatingMode, PlatformComponentId, Tenant } from "./types";

export type { OperatingMode };

export const INDIVIDUAL_HIDDEN_COMPONENT_IDS: PlatformComponentId[] = [
  "admin",
  "users",
  "profiles",
  "areas",
  "project_staff",
];

const INDIVIDUAL_HIDDEN_HREFS = new Set(["/admin", "/users", "/profiles", "/areas", "/teams"]);

const INDIVIDUAL_MOBILE_BY_HREF: Record<string, number> = {
  "/demo": 1,
  "/progress": 2,
  "/minutas": 3,
  "/gantt": 4,
};

export const OPERATING_MODE_OPTIONS: {
  id: OperatingMode;
  label: string;
  subtitle: string;
  description: string;
  howItWorks: string;
}[] = [
  {
    id: "individual",
    label: "Profesional independiente",
    subtitle: "1 persona",
    description:
      "Trabajas solo. Cubres cliente, kickoff, presupuesto, calendario y el control de la obra. No registras usuarios ni áreas.",
    howItWorks:
      "Permisos de operación completos, sin pantallas de Personas, Puestos ni Áreas. Las minutas registran gastos e instrucciones. Puedes pasar a colaborativo cuando quieras. Volver a individual solo si no hay otros usuarios.",
  },
  {
    id: "collaborative",
    label: "Equipo colaborativo",
    subtitle: "2 o más personas",
    description:
      "Hay contrapartes. Registras áreas, puestos e invitaciones. En kickoff cada área deja su comentario; el administrador no escribe como otro puesto si ya hay dueño.",
    howItWorks:
      "Mínimo dos usuarios. El flujo F1–F7 es el mismo; cambia quién firma cada paso. Con el primer colaborador el modo individual se bloquea hasta que no quede nadie más en el equipo.",
  },
];

export const OPERATING_MODE_LABEL: Record<OperatingMode, string> = {
  individual: "Individual",
  collaborative: "Colaborativo",
};

export type AppChannel = "development" | "staging";

/** Railway y `next start` quedan en staging. `npm run dev` queda en development. */
export function appChannel(): AppChannel {
  const raw = process.env.NEXT_PUBLIC_APP_CHANNEL;
  if (raw === "staging" || raw === "development") return raw;
  return process.env.NODE_ENV === "development" ? "development" : "staging";
}

/** En staging el modo colaborativo no ofrece cambiar «Cómo trabajas». */
export function showOperatingModeTools(mode: OperatingMode | "") {
  if (appChannel() === "development") return true;
  return mode !== "collaborative";
}

export function resolveOperatingMode(tenant: Pick<Tenant, "operatingMode" | "companySize">): OperatingMode | "" {
  if (tenant.operatingMode === "individual" || tenant.operatingMode === "collaborative") {
    return tenant.operatingMode;
  }
  if (tenant.companySize === "independent") return "individual";
  if (tenant.companySize) return "collaborative";
  return "";
}

export function isIndividualMode(tenant: Pick<Tenant, "operatingMode" | "companySize">) {
  return resolveOperatingMode(tenant) === "individual";
}

export function extraCollaborators<T extends { active: boolean; role: string }>(users: T[]) {
  return users.filter((item) => item.active && item.role !== "owner");
}

export function canReturnToIndividual<T extends { active: boolean; role: string }>(users: T[]) {
  return extraCollaborators(users).length === 0;
}

export function companySizeForMode(mode: OperatingMode, current: CompanySize | ""): CompanySize | "" {
  if (mode === "individual") return "independent";
  if (current && current !== "independent") return current;
  return "small";
}

export function filterNavForMode(nav: NavItem[], individual: boolean): NavItem[] {
  if (!individual) return nav;
  return nav
    .filter((item) => !INDIVIDUAL_HIDDEN_HREFS.has(item.href))
    .map((item) => ({
      ...item,
      mobile: INDIVIDUAL_MOBILE_BY_HREF[item.href],
    }));
}
