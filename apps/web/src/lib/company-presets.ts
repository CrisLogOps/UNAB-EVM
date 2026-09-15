import { defaultComponentIds, PLATFORM_COMPONENTS } from "./components-catalog";
import { ROLE_LABELS } from "./constants";
import { ROLE_GUIDE } from "./raci-guide";
import type { CompanySize, OrgArea, OrgProfile, UserRole } from "./types";

export type { CompanySize };

export interface CompanyPreset {
  id: CompanySize;
  label: string;
  subtitle: string;
  typicalHeadcount: string;
  minAreas: number;
  maxAreas: number;
  roles: UserRole[];
  whatItMeans: string;
  howPmAdapts: string;
}

export const COMPANY_PRESETS: CompanyPreset[] = [
  {
    id: "independent",
    label: "Profesional independiente",
    subtitle: "Una sola área",
    typicalHeadcount: "1 área",
    minAreas: 1,
    maxAreas: 1,
    roles: ["owner"],
    whatItMeans:
      "Solo Dirección. El representante cubre la operación; no registra áreas ni contactos adicionales.",
    howPmAdapts: "Los perfiles y el equipo se cierran después, cuando haga falta sumar gente.",
  },
  {
    id: "small",
    label: "Empresa pequeña",
    subtitle: "Pocas áreas especializadas",
    typicalHeadcount: "2 a 4 áreas",
    minAreas: 2,
    maxAreas: 4,
    roles: ["owner", "pmo", "finance", "field"],
    whatItMeans:
      "Dirección más 1 a 3 áreas (por ejemplo gestión de proyectos, finanzas o terreno). Cada área lleva al menos un contacto.",
    howPmAdapts: "Si falta Finanzas o Terreno, en Puestos se marcan tareas extra al gerente de proyectos.",
  },
  {
    id: "medium",
    label: "Empresa mediana",
    subtitle: "Varias áreas con contacto propio",
    typicalHeadcount: "5 a 7 áreas",
    minAreas: 5,
    maxAreas: 7,
    roles: ["owner", "pmo", "finance", "commercial", "warehouse", "field"],
    whatItMeans:
      "Suma comercial, logística y terreno a las áreas de una empresa pequeña. Cada una registra colaboradores y un contacto.",
    howPmAdapts: "El gerente sigue con obras y calendario. Comercial comparte el visto bueno del presupuesto.",
  },
  {
    id: "large",
    label: "Gran empresa",
    subtitle: "Estructura completa",
    typicalHeadcount: "8 o más áreas",
    minAreas: 8,
    maxAreas: 12,
    roles: ["owner", "pmo", "admin_obra", "finance", "commercial", "warehouse", "field", "subcontractor"],
    whatItMeans:
      "Todas las áreas de ejemplo (proyectos, finanzas, comercial, logística, terreno, faena, subcontratos) y las que agregues.",
    howPmAdapts: "Casi no hacen falta tareas extra: cada área tiene dueño y contacto.",
  },
];

export const PRESET_ROLES: Record<CompanySize, UserRole[]> = {
  independent: COMPANY_PRESETS[0].roles,
  small: COMPANY_PRESETS[1].roles,
  medium: COMPANY_PRESETS[2].roles,
  large: COMPANY_PRESETS[3].roles,
};

export function presetById(id: CompanySize): CompanyPreset {
  return COMPANY_PRESETS.find((item) => item.id === id) ?? COMPANY_PRESETS[1];
}

export function presetsIncludingRole(role: UserRole): CompanySize[] {
  return COMPANY_PRESETS.filter((item) => item.roles.includes(role)).map((item) => item.id);
}

export function detectCompanySize(areas: OrgArea[]): CompanySize | "custom" {
  const enabled = new Set(areas.filter((item) => item.enabled).map((item) => item.role));
  for (const preset of COMPANY_PRESETS) {
    if (preset.roles.length !== enabled.size) continue;
    if (preset.roles.every((role) => enabled.has(role))) return preset.id;
  }
  return "custom";
}

export function areaCountInRange(size: CompanySize, count: number) {
  const preset = presetById(size);
  return count >= preset.minAreas && count <= preset.maxAreas;
}

export function defaultProfileDraft(role: UserRole, areas: OrgArea[]): OrgProfile | null {
  if (role === "owner" || role === "viewer") return null;
  const area = areas.find((item) => item.role === role);
  if (!area) return null;
  return {
    id: `pf-${role}`,
    name: ROLE_LABELS[role],
    role,
    areaId: area.id,
    description: ROLE_GUIDE[role]?.summary ?? ROLE_LABELS[role],
    componentIds: defaultComponentIds(role),
    extraTaskIds: [],
  };
}

export function screensForRole(role: UserRole): string[] {
  return defaultComponentIds(role)
    .map((id) => PLATFORM_COMPONENTS.find((item) => item.id === id)?.label)
    .filter((item): item is string => Boolean(item));
}

export const PRESET_LABEL: Record<CompanySize, string> = {
  independent: "Independiente",
  small: "Pequeña",
  medium: "Mediana",
  large: "Grande",
};
