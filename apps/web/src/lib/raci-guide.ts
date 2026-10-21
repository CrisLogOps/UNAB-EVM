import type { UserRole } from "./types";

/** Qué hace cada puesto, en lenguaje de obra. */
export const ROLE_GUIDE: Record<UserRole, { title: string; summary: string; duties: string[] }> = {
  owner: {
    title: "Administrador",
    summary: "Arma la empresa, invita gente y mira cómo van las obras. Si aún no hay equipo, puede hacerlo todo.",
    duties: [
      "Ver en Inicio qué falta",
      "Invitar personas",
      "Cargar el presupuesto y los gastos si no hay Finanzas ni terreno",
      "Dar el visto bueno al presupuesto",
      "En modo independiente: anotar minutas de gasto e instrucciones",
    ],
  },
  pmo: {
    title: "Gestor de proyectos",
    summary: "Recibe lo vendido por Comercial, confirma con juicio experto si se puede cumplir y ordena la ejecución.",
    duties: [
      "Validar el kickoff interno",
      "Revisar el presupuesto y fundar la contrapropuesta con un archivo",
      "Armar el cronograma",
      "Registrar minutas cuando una instrucción mueve el gasto",
    ],
  },
  admin_obra: {
    title: "Jefe de faena",
    summary: "Mira el estado en terreno y respalda las partidas que el cronograma le asigna.",
    duties: ["Ver el estado de la obra", "Cargar evidencia de tus partidas", "Anotar la minuta del gasto"],
  },
  finance: {
    title: "Finanzas",
    summary: "Carga el presupuesto, los gastos reales y el respaldo de las partidas que le tocan en el plan.",
    duties: ["Cargar presupuesto", "Registrar pagos", "Subir evidencia de escritorio"],
  },
  commercial: {
    title: "Comercial",
    summary: "Aprueba el presupuesto junto al administrador y respalda las partidas comerciales del cronograma.",
    duties: ["Aprobar presupuesto", "Ver desvíos de costo", "Subir evidencia de escritorio"],
  },
  warehouse: {
    title: "Bodega",
    summary: "Entrega materiales y respalda las partidas logísticas del cronograma.",
    duties: ["Despachar materiales", "Atender pedidos de terreno", "Subir evidencia de escritorio"],
  },
  field: {
    title: "Terreno",
    summary: "Registra el avance del día con foto o archivo. Sin evidencia validada, el avance no cuenta.",
    duties: ["Ver el estado de tus labores", "Cargar avance", "Anotar el gasto en una minuta", "Adjuntar foto o documento"],
  },
  subcontractor: {
    title: "Subcontrato",
    summary: "Informa el avance de su partida y adjunta foto o documento.",
    duties: ["Ver el estado de tu partida", "Reportar avance", "Adjuntar evidencia"],
  },
  oficina_tecnica: {
    title: "Oficina técnica",
    summary: "Respalda partidas técnicas del cronograma y apoya la revisión de evidencias.",
    duties: ["Revisar partidas", "Subir evidencia de escritorio", "Ayudar a validar evidencias"],
  },
  viewer: {
    title: "Solo consulta",
    summary: "Puede mirar el estado, sin cambiar nada.",
    duties: ["Ver el estado de la obra"],
  },
};

export const SETUP_INVITE_ROLES: UserRole[] = [
  "pmo",
  "finance",
  "commercial",
  "field",
  "admin_obra",
  "warehouse",
  "subcontractor",
];

export const ADMIN_FLOW = [
  { step: "1", title: "Clientes", text: "Registra razón social, RUT y el proyecto de cada cliente.", href: "/clients" },
  { step: "2", title: "Kickoff", text: "Interno (Comercial entrega, el gestor confirma) y con el cliente (inicia el cronograma).", href: "/clients" },
  { step: "3", title: "Presupuesto", text: "Cargar, revisar y aprobar el BAC para controlar costo.", href: "/budget" },
  { step: "4", title: "Cronograma", text: "Actividades con inicio, término y confirmación del plan.", href: "/gantt" },
  { step: "5", title: "Control", text: "Curva S, valor ganado, CPI y SPI; cada puesto ve sus actividades.", href: "/demo" },
] as const;
