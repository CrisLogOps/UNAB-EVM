import type { UserRole } from "./types";

export const ALERT_THRESHOLDS = {
  cpiGreenMin: 1.0,
  cpiYellowMin: 0.9,
  spitGreenMin: 1.0,
  spitYellowMin: 0.9,
  tcpiGreenMax: 1.0,
  tcpiYellowMax: 1.1,
} as const;

export const SETUP_STORAGE_KEY = "openevm.setup.v2";
export const SETUP_RESET_QUERY = "desde-cero";

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Administrador",
  pmo: "Gestor de proyectos",
  admin_obra: "Jefe de faena",
  finance: "Finanzas",
  commercial: "Comercial",
  warehouse: "Bodega",
  field: "Terreno",
  subcontractor: "Subcontrato",
  oficina_tecnica: "Oficina técnica",
  viewer: "Solo consulta",
};

export const NAV_GROUP_LABELS = {
  hoy: "Hoy",
  personas: "Personas",
  obra: "La obra",
  dinero: "Dinero",
  empresa: "Empresa",
} as const;

export type NavGroup = keyof typeof NAV_GROUP_LABELS;
