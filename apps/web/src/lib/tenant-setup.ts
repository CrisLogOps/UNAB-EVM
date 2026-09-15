import type { CompanySize, UserRole } from "./types";

export const ACTIVITY_TYPES = [
  { id: "obras-civiles", label: "Construcción de obras civiles" },
  { id: "edificacion", label: "Edificación" },
  { id: "instalaciones", label: "Instalaciones (eléctrica, sanitaria u otras)" },
  { id: "mantencion", label: "Mantención industrial y faenas" },
  { id: "gestion", label: "Consultoría y gestión de proyectos" },
  { id: "otro", label: "Otra actividad" },
] as const;

export function activityTypeLabel(id: string) {
  return ACTIVITY_TYPES.find((item) => item.id === id)?.label ?? id;
}

export interface AreaCatalogItem {
  id: string;
  name: string;
  role: UserRole;
  defaultHeadcount: number;
  description: string;
  example: string;
  locked?: boolean;
}

export const AREA_CATALOG: AreaCatalogItem[] = [
  {
    id: "area-dir",
    name: "Dirección",
    role: "owner",
    defaultHeadcount: 1,
    locked: true,
    description: "El representante legal arma el tenant y da el visto bueno.",
    example: "Siempre existe · el representante es el contacto",
  },
  {
    id: "area-pmo",
    name: "Área de gestión de proyectos",
    role: "pmo",
    defaultHeadcount: 1,
    description: "Planifica obras, calendario y control de avance.",
    example: "1 colaborador",
  },
  {
    id: "area-fin",
    name: "Área de Finanzas",
    role: "finance",
    defaultHeadcount: 1,
    description: "Carga presupuesto y pagos de la obra.",
    example: "1 colaborador",
  },
  {
    id: "area-com",
    name: "Área Comercial",
    role: "commercial",
    defaultHeadcount: 2,
    description: "Cierre comercial del presupuesto con el administrador.",
    example: "2 colaboradores",
  },
  {
    id: "area-bod",
    name: "Área Logística",
    role: "warehouse",
    defaultHeadcount: 1,
    description: "Recepción, despacho y stock de materiales.",
    example: "1 colaborador",
  },
  {
    id: "area-ter",
    name: "Área de Operaciones / Terreno",
    role: "field",
    defaultHeadcount: 1,
    description: "Avance en faena, evidencia y pedidos de material.",
    example: "1 colaborador",
  },
  {
    id: "area-obra",
    name: "Administración de obra",
    role: "admin_obra",
    defaultHeadcount: 1,
    description: "Validación en faena cuando hay jefe de obra.",
    example: "1 colaborador",
  },
  {
    id: "area-sub",
    name: "Subcontratos / Proveedores",
    role: "subcontractor",
    defaultHeadcount: 1,
    description: "Partidas de terceros con evidencia propia.",
    example: "1 colaborador",
  },
];

export const DIRECTION_AREA_ID = "area-dir";

export const SIZE_SUGGESTED_AREA_IDS: Record<CompanySize, string[]> = {
  independent: [DIRECTION_AREA_ID],
  small: [DIRECTION_AREA_ID, "area-pmo", "area-fin", "area-ter"],
  medium: [DIRECTION_AREA_ID, "area-pmo", "area-fin", "area-com", "area-bod", "area-ter"],
  large: AREA_CATALOG.map((item) => item.id),
};

export function suggestedAreaIds(size: CompanySize) {
  return SIZE_SUGGESTED_AREA_IDS[size] ?? [DIRECTION_AREA_ID];
}

export interface AreaDraft {
  id: string;
  name: string;
  role: UserRole;
  description: string;
  headcount: number;
  contactName: string;
  contactEmail: string;
  custom?: boolean;
}

export function emptyAreaDraft(item: AreaCatalogItem): AreaDraft {
  return {
    id: item.id,
    name: item.name,
    role: item.role,
    description: item.description,
    headcount: item.defaultHeadcount,
    contactName: "",
    contactEmail: "",
  };
}
