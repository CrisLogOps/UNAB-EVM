import { areaReviewsComplete, partiesValidated, proposalReady } from "./kickoff";
import type {
  GanttActivity,
  KnowledgeEntry,
  OrgArea,
  ProgressReport,
  Project,
  ProjectKickoff,
  ProjectAssignment,
  Client,
} from "./types";

/** Estado de un paso del libro F1–F7 respecto de OpenEVM. */
export type LifecycleStatus = "done" | "current" | "open" | "partial" | "planned";

export type ProcessPhaseId = "F0" | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7";

export interface ProcessStepDef {
  id: string;
  phase: ProcessPhaseId;
  name: string;
  /** Cómo lo resuelve OpenEVM hoy (no el texto del Excel). */
  inOpenEvm: string;
  href: string;
  /** Si false, el paso está documentado pero no hay módulo operable. */
  inProduct: boolean;
}

export interface ProcessPhaseDef {
  id: ProcessPhaseId;
  name: string;
  pmbok: string;
  goal: string;
  entry: string;
  exit: string;
}

export interface LifecycleContext {
  setupDone: boolean;
  clients: Client[];
  project: Project;
  kickoff?: ProjectKickoff;
  areas: OrgArea[];
  assignments: ProjectAssignment[];
  activities: GanttActivity[];
  reports: ProgressReport[];
  knowledge: KnowledgeEntry[];
  independent: boolean;
}

export interface EvaluatedStep extends ProcessStepDef {
  status: LifecycleStatus;
}

export interface EvaluatedPhase extends ProcessPhaseDef {
  status: LifecycleStatus;
  done: number;
  total: number;
  steps: EvaluatedStep[];
}

export const PROCESS_PHASES: ProcessPhaseDef[] = [
  {
    id: "F0",
    name: "Alta del tenant",
    pmbok: "Previo al ciclo del contrato (OpenEVM)",
    goal: "Dejar la empresa, áreas y puestos listos antes de registrar una adjudicación.",
    entry: "Representante entra a la plataforma.",
    exit: "Tenant, áreas y perfiles guardados. Inicio muestra el ciclo del proyecto.",
  },
  {
    id: "F1",
    name: "Adjudicación y formalización",
    pmbok: "Pre-proyecto (previo a iniciación)",
    goal: "Formalizar lo vendido y traspasar de Comercial a operaciones.",
    entry: "Notificación de adjudicación.",
    exit: "Contrato y margen traspasados; kickoff Comercial → operaciones.",
  },
  {
    id: "F2",
    name: "Inicio del proyecto",
    pmbok: "Iniciación",
    goal: "Validar lo vendido con todas las áreas y fijar el Día 1 con el cliente.",
    entry: "Antecedentes de venta traspasados (F1.5).",
    exit: "Kickoff con el cliente (Día 1). Ahí se abre el cronograma.",
  },
  {
    id: "F3",
    name: "Planificación",
    pmbok: "Planificación",
    goal: "Líneas base de alcance, tiempo y costo.",
    entry: "Acta de constitución / proyecto iniciado.",
    exit: "EDT, calendario y presupuesto listos para controlar.",
  },
  {
    id: "F4",
    name: "Ejecución",
    pmbok: "Ejecución",
    goal: "Ejecutar lo planificado y reportar avance con evidencia.",
    entry: "Línea de trabajo cargada.",
    exit: "Avance físico y costo reportados al control.",
  },
  {
    id: "F5",
    name: "Monitoreo y control",
    pmbok: "Monitoreo y control (en paralelo a F4)",
    goal: "EVM / Curva S, candado de evidencia y desvíos vs línea base.",
    entry: "Reporte de avance desde ejecución.",
    exit: "Alcance contratado completado (incluido lo aprobado por cambio).",
  },
  {
    id: "F6",
    name: "Cierre contractual",
    pmbok: "Cierre",
    goal: "Recepción, TOP, liquidación y lecciones aprendidas.",
    entry: "Alcance al 100%.",
    exit: "TOP aceptado y dossier interno listo para postventa.",
  },
  {
    id: "F7",
    name: "Garantías y postventa",
    pmbok: "Post-cierre / transición operacional",
    goal: "Traspaso a postventa y gestión del período de garantía.",
    entry: "Dossier técnico interno.",
    exit: "Garantías liberadas y proyecto archivado.",
  },
];

export const PROCESS_STEPS: ProcessStepDef[] = [
  {
    id: "F0.1",
    phase: "F0",
    name: "Empresa, áreas y puestos",
    inOpenEvm: "Setup 0: representante, RUT, tamaño por áreas, perfiles y equipo. Queda en este navegador.",
    href: "/admin",
    inProduct: true,
  },
  {
    id: "F1.1",
    phase: "F1",
    name: "Notificación de adjudicación",
    inOpenEvm: "Se registra el cliente (razón social y RUT) y se abre la carpeta de obra. El oficio de adjudicación aún no es un documento aparte.",
    href: "/clients",
    inProduct: true,
  },
  {
    id: "F1.2",
    phase: "F1",
    name: "Revisión de condiciones contractuales",
    inOpenEvm: "Comercial carga condiciones, exclusiones y el documento de propuesta inicial. El loop de negociación legal no está modelado como módulo.",
    href: "/clients",
    inProduct: true,
  },
  {
    id: "F1.3",
    phase: "F1",
    name: "Firma y garantías contractuales",
    inOpenEvm: "El gestor anota tipo de contrato y garantías en el kickoff interno. Boletas y canje de fiel cumplimiento quedan para F6/F7.",
    href: "/clients",
    inProduct: true,
  },
  {
    id: "F1.4",
    phase: "F1",
    name: "Designación del equipo",
    inOpenEvm: "En la obra se asigna quién trabaja el proyecto. El independiente cubre todos los puestos.",
    href: "/teams",
    inProduct: true,
  },
  {
    id: "F1.5",
    phase: "F1",
    name: "Kickoff Comercial → operaciones",
    inOpenEvm: "Comercial sella alcance vendido, plazos, costos/margen y adjunta la propuesta. Todas las áreas leen el mismo extracto.",
    href: "/clients",
    inProduct: true,
  },
  {
    id: "F2.1",
    phase: "F2",
    name: "Revisión técnica de lo vendido",
    inOpenEvm: "Cada área involucrada deja por escrito las razones (viable / condicionado / no viable). Un documento de respaldo es opcional. Sin esas razones no hay kickoff con el cliente. Eso alimenta Conocimiento.",
    href: "/demo",
    inProduct: true,
  },
  {
    id: "F2.2",
    phase: "F2",
    name: "Acta de constitución / juicio del gestor",
    inOpenEvm: "El gestor sintetiza el conocimiento de las áreas y solo cierra si el criterio crítico lo permite; arma la propuesta final al cliente.",
    href: "/clients",
    inProduct: true,
  },
  {
    id: "F2.3",
    phase: "F2",
    name: "Interesados",
    inOpenEvm: "Hoy solo está el cliente de la obra. Mandante adicional, comunidad o fiscalizadores no tienen módulo.",
    href: "/clients",
    inProduct: false,
  },
  {
    id: "F2.4",
    phase: "F2",
    name: "Kickoff con el cliente (Día 1)",
    inOpenEvm: "Solo se registra si el criterio crítico interno está aprobado. Ese cierre abre el calendario.",
    href: "/clients",
    inProduct: true,
  },
  {
    id: "F2.5",
    phase: "F2",
    name: "Organigrama y RACI del proyecto",
    inOpenEvm: "Los puestos salen de las áreas del tenant. La matriz operativa está en Puestos; no se publica como RACI en pantalla.",
    href: "/profiles",
    inProduct: true,
  },
  {
    id: "F3.1",
    phase: "F3",
    name: "Alcance EDT / WBS",
    inOpenEvm: "Plantilla CSV o alta manual: paquete, actividad, inspección e hito, con responsable de área.",
    href: "/gantt",
    inProduct: true,
  },
  {
    id: "F3.2",
    phase: "F3",
    name: "Cronograma base",
    inOpenEvm: "Fechas de inicio/término y línea base por elemento. Los desvíos se editan después sin borrar el plan original.",
    href: "/gantt",
    inProduct: true,
  },
  {
    id: "F3.3",
    phase: "F3",
    name: "Presupuesto y curva S planificada",
    inOpenEvm: "Finanzas propone el BAC; el gestor revisa; administrador o comercial da el visto bueno. PV/EV/AC en Inicio.",
    href: "/budget",
    inProduct: true,
  },
  {
    id: "F3.4",
    phase: "F3",
    name: "Plan de riesgos",
    inOpenEvm: "Documentado en el libro de proceso. Sin módulo de matriz de riesgos.",
    href: "/demo",
    inProduct: false,
  },
  {
    id: "F3.5",
    phase: "F3",
    name: "Plan de adquisiciones y subcontratos",
    inOpenEvm: "Hay puestos de Bodega y Subcontrato. El plan de compras aún no se carga como documento de fase.",
    href: "/demo",
    inProduct: false,
  },
  {
    id: "F3.6",
    phase: "F3",
    name: "Plan de calidad",
    inOpenEvm: "Previsto. La calidad operativa hoy es la evidencia validada de cada partida.",
    href: "/evidence",
    inProduct: false,
  },
  {
    id: "F3.7",
    phase: "F3",
    name: "Comunicaciones y recursos",
    inOpenEvm: "Inicio muestra qué le toca a cada puesto. No hay plan de informes aparte.",
    href: "/demo",
    inProduct: false,
  },
  {
    id: "F3.8",
    phase: "F3",
    name: "Plan de gestión integrado",
    inOpenEvm: "El plan vivo es la suma de kickoff + EDT + presupuesto. No hay un PDF único de plan.",
    href: "/demo",
    inProduct: false,
  },
  {
    id: "F3.9",
    phase: "F3",
    name: "Aprobación de línea base",
    inOpenEvm: "Cada actividad guarda su plan original. El freeze formal (DRAFT → v1.0) está pendiente en /baseline.",
    href: "/baseline",
    inProduct: false,
  },
  {
    id: "F4.1",
    phase: "F4",
    name: "Movilización de recursos",
    inOpenEvm: "Previsto. No hay acta de instalación de faena.",
    href: "/gantt",
    inProduct: false,
  },
  {
    id: "F4.2",
    phase: "F4",
    name: "Permisos y permisología",
    inOpenEvm: "El gestor anota permisos en el kickoff interno. No hay bitácora de resoluciones.",
    href: "/clients",
    inProduct: false,
  },
  {
    id: "F4.3",
    phase: "F4",
    name: "Compra de materiales e importaciones",
    inOpenEvm: "Bodega despacha; terreno pide material. Órdenes de compra e importación no están.",
    href: "/demo",
    inProduct: false,
  },
  {
    id: "F4.4",
    phase: "F4",
    name: "Contratación de personal",
    inOpenEvm: "Personas y puestos del tenant. Contratos laborales quedan fuera del MVP.",
    href: "/users",
    inProduct: true,
  },
  {
    id: "F4.5",
    phase: "F4",
    name: "Ejecución según EDT / cronograma",
    inOpenEvm: "Avance: terreno sube foto (cámara o archivo) y las otras áreas suben PDF o planilla según el responsable del cronograma.",
    href: "/progress",
    inProduct: true,
  },
  {
    id: "F4.6",
    phase: "F4",
    name: "Subcontratos y proveedores",
    inOpenEvm: "El puesto Subcontrato reporta solo sus partidas, con la misma regla de evidencia.",
    href: "/progress",
    inProduct: true,
  },
  {
    id: "F4.7",
    phase: "F4",
    name: "Anticipos y facturación",
    inOpenEvm: "Pantalla de pagos es un placeholder. El costo real (AC) se anota al cargar avance o en Gastos.",
    href: "/finance",
    inProduct: false,
  },
  {
    id: "F4.8",
    phase: "F4",
    name: "Aseguramiento de calidad",
    inOpenEvm: "Hoy equivale a validar la evidencia de cada partida. No hay no-conformidades aparte.",
    href: "/evidence",
    inProduct: false,
  },
  {
    id: "F4.9",
    phase: "F4",
    name: "Desarrollo del equipo",
    inOpenEvm: "Previsto. La capacitación interna actual es el proyecto de inducción al crear la primera obra.",
    href: "/gantt",
    inProduct: false,
  },
  {
    id: "F4.10",
    phase: "F4",
    name: "Informe periódico de avance",
    inOpenEvm: "Inicio muestra EV, CPI, SPI y Curva S. Cortes de control siguen pendientes.",
    href: "/demo",
    inProduct: true,
  },
  {
    id: "F5.1",
    phase: "F5",
    name: "Medición de avance y candado EV",
    inOpenEvm: "Sin evidencia validada el valor ganado de esa partida no suma. Aplica a faena y a escritorio.",
    href: "/evidence",
    inProduct: true,
  },
  {
    id: "F5.2",
    phase: "F5",
    name: "Cálculo EVM y Curva S",
    inOpenEvm: "Motor en Inicio: PV, EV, AC a partir del cronograma, el BAC y los reportes validados.",
    href: "/demo",
    inProduct: true,
  },
  {
    id: "F5.3",
    phase: "F5",
    name: "Control SPI / CPI",
    inOpenEvm: "Semáforos en Inicio. Si hay evidencias en revisión, el EV queda con candado.",
    href: "/demo",
    inProduct: true,
  },
  {
    id: "F5.4",
    phase: "F5",
    name: "Acción correctiva / replan",
    inOpenEvm: "En Calendario se edita el desvío de fechas conservando la línea base. No hay acta de acción correctiva.",
    href: "/gantt",
    inProduct: true,
  },
  {
    id: "F5.5",
    phase: "F5",
    name: "Variaciones de obra",
    inOpenEvm: "Se ven como desvío vs línea base en el Gantt. No hay solicitud formal de aumento/disminución.",
    href: "/gantt",
    inProduct: false,
  },
  {
    id: "F5.6",
    phase: "F5",
    name: "Acuerdo económico con el mandante",
    inOpenEvm: "Previsto. El anexo de contrato no está en el MVP.",
    href: "/clients",
    inProduct: false,
  },
  {
    id: "F5.7",
    phase: "F5",
    name: "Cambio de línea base",
    inOpenEvm: "El freeze/replan v2.0 está pendiente. Hoy no se versiona el BAC ni el Gantt.",
    href: "/baseline",
    inProduct: false,
  },
  {
    id: "F5.8",
    phase: "F5",
    name: "Control de calidad y no conformidades",
    inOpenEvm: "Previsto. Rechazar una evidencia obliga a volver a cargar avance (loop F5.1 → F4.5).",
    href: "/evidence",
    inProduct: false,
  },
  {
    id: "F5.9",
    phase: "F5",
    name: "Seguimiento de riesgos",
    inOpenEvm: "Previsto.",
    href: "/demo",
    inProduct: false,
  },
  {
    id: "F5.10",
    phase: "F5",
    name: "Informe de desempeño",
    inOpenEvm: "El tablero de Inicio es el informe vivo. Cortes periódicos siguen pendientes.",
    href: "/demo",
    inProduct: true,
  },
  {
    id: "F5.11",
    phase: "F5",
    name: "Verificación de cierre de alcance",
    inOpenEvm: "Cuando todas las hojas del EDT tienen evidencia validada al 100%. No hay gate formal a F6.",
    href: "/demo",
    inProduct: false,
  },
  {
    id: "F6.1",
    phase: "F6",
    name: "Pruebas de aceptación / puesta en marcha",
    inOpenEvm: "Previsto. Se puede respaldar como partida de escritorio o inspección, pero no hay protocolo de commissioning.",
    href: "/progress",
    inProduct: false,
  },
  {
    id: "F6.2",
    phase: "F6",
    name: "Recepción provisoria",
    inOpenEvm: "Previsto. El proyecto puede marcarse cerrado, sin acta de recepción.",
    href: "/projects",
    inProduct: false,
  },
  {
    id: "F6.3",
    phase: "F6",
    name: "Subsanación de observaciones",
    inOpenEvm: "Previsto (loop del libro F6.3 → F6.2).",
    href: "/progress",
    inProduct: false,
  },
  {
    id: "F6.4",
    phase: "F6",
    name: "Turnover Package (TOP)",
    inOpenEvm: "Previsto. Distinto del dossier interno y de la base de conocimiento.",
    href: "/knowledge",
    inProduct: false,
  },
  {
    id: "F6.5",
    phase: "F6",
    name: "Recepción final",
    inOpenEvm: "Previsto.",
    href: "/projects",
    inProduct: false,
  },
  {
    id: "F6.6",
    phase: "F6",
    name: "Liquidación del contrato",
    inOpenEvm: "Previsto en Pagos / finiquito.",
    href: "/finance",
    inProduct: false,
  },
  {
    id: "F6.7",
    phase: "F6",
    name: "Devolución o canje de garantías",
    inOpenEvm: "Previsto.",
    href: "/finance",
    inProduct: false,
  },
  {
    id: "F6.8",
    phase: "F6",
    name: "Cierre administrativo y financiero",
    inOpenEvm: "El estado Cerrado existe en el proyecto; el checklist de cierre no.",
    href: "/projects",
    inProduct: false,
  },
  {
    id: "F6.9",
    phase: "F6",
    name: "Lecciones aprendidas",
    inOpenEvm: "Las razones escritas de kickoff ya quedan en Conocimiento, por área. Un adjunto es opcional. Falta el registro de cierre del proyecto.",
    href: "/knowledge",
    inProduct: true,
  },
  {
    id: "F6.10",
    phase: "F6",
    name: "Dossier técnico interno (as-built)",
    inOpenEvm: "Previsto. No se mezcla con el TOP del cliente.",
    href: "/knowledge",
    inProduct: false,
  },
  {
    id: "F7.1",
    phase: "F7",
    name: "Capacitación a postventa",
    inOpenEvm: "Previsto.",
    href: "/knowledge",
    inProduct: false,
  },
  {
    id: "F7.2",
    phase: "F7",
    name: "Acta de traspaso a postventa",
    inOpenEvm: "Previsto. Activa garantía de instalación (operaciones) y de producto (comercial).",
    href: "/projects",
    inProduct: false,
  },
  {
    id: "F7.3",
    phase: "F7",
    name: "Activación del período de garantía",
    inOpenEvm: "Previsto. El kickoff ya permite anotar garantías, sin plazos de póliza.",
    href: "/clients",
    inProduct: false,
  },
  {
    id: "F7.4",
    phase: "F7",
    name: "Mesa de solicitudes de garantía",
    inOpenEvm: "Previsto. Tickets de falla de instalación vs producto.",
    href: "/demo",
    inProduct: false,
  },
  {
    id: "F7.5",
    phase: "F7",
    name: "Cierre del período de garantía",
    inOpenEvm: "Previsto.",
    href: "/projects",
    inProduct: false,
  },
  {
    id: "F7.6",
    phase: "F7",
    name: "Liberación final y archivo",
    inOpenEvm: "Previsto. Fin del flujo del libro Rev3.",
    href: "/projects",
    inProduct: false,
  },
];

function realProject(project: Project) {
  return project.id !== "prj-pending";
}

function completionOf(id: string, ctx: LifecycleContext): "done" | "partial" | "empty" {
  const kickoff = ctx.kickoff;
  const clientOk = ctx.clients.length > 0;
  const projectOk = realProject(ctx.project);
  const commercial = Boolean(kickoff?.commercialDeliveredAt);
  const areasOk = Boolean(kickoff && areaReviewsComplete(kickoff, ctx.areas));
  const pmOk = Boolean(kickoff?.pmValidatedAt) || Boolean(kickoff && partiesValidated(kickoff));
  const clientKick = ctx.project.kickoffPhase === "client_done";
  const teamOk = ctx.independent || ctx.assignments.some((item) => item.projectId === ctx.project.id);
  const hasLeaves = ctx.activities.some((item) => item.elementKind !== "paquete");
  const budgetOk = Boolean(ctx.project.bac);
  const budgetStarted =
    budgetOk || ctx.project.proposedBac != null || ctx.project.status === "budget_proposed";
  const projectReports = ctx.reports.filter((item) => item.projectId === ctx.project.id);
  const uploaded = projectReports.some((item) => item.evidenceStatus === "uploaded" || item.evidenceStatus === "validated");
  const validated = projectReports.some((item) => item.evidenceStatus === "validated");
  const deviation = ctx.activities.some((item) => item.start !== item.baselineStart || item.end !== item.baselineFinish);
  const knowledgeHere = ctx.knowledge.some((item) => item.projectId === ctx.project.id);

  switch (id) {
    case "F0.1":
      return ctx.setupDone ? "done" : "empty";
    case "F1.1":
      if (projectOk) return "done";
      if (clientOk) return "partial";
      return "empty";
    case "F1.2":
      if (commercial) return "done";
      if (kickoff && (kickoff.commercialConditions.trim() || proposalReady(kickoff.proposal))) return "partial";
      return "empty";
    case "F1.3":
      if (kickoff?.guarantees.trim() && kickoff.contractType.trim()) return "done";
      if (pmOk) return "partial";
      return "empty";
    case "F1.4":
      if (!projectOk) return "empty";
      return teamOk ? "done" : "empty";
    case "F1.5":
      return commercial ? "done" : "empty";
    case "F2.1":
      if (areasOk) return "done";
      if (kickoff && kickoff.areaReviews.length) return "partial";
      return "empty";
    case "F2.2":
      return pmOk ? "done" : "empty";
    case "F2.3":
      return clientOk ? "partial" : "empty";
    case "F2.4":
      return clientKick ? "done" : "empty";
    case "F2.5":
      return ctx.setupDone ? "done" : "empty";
    case "F3.1":
    case "F3.2":
      return hasLeaves ? "done" : "empty";
    case "F3.3":
      if (budgetOk) return "done";
      if (budgetStarted) return "partial";
      return "empty";
    case "F3.9":
      if (ctx.project.baselineStatus === "FROZEN") return "done";
      if (hasLeaves) return "partial";
      return "empty";
    case "F4.4":
      return ctx.setupDone ? "done" : "empty";
    case "F4.5":
    case "F4.6":
      if (validated) return "done";
      if (uploaded) return "partial";
      return "empty";
    case "F4.10":
    case "F5.2":
    case "F5.3":
    case "F5.10":
      return hasLeaves ? "done" : "empty";
    case "F5.1":
      if (validated) return "done";
      if (uploaded) return "partial";
      return "empty";
    case "F5.4":
      return deviation ? "done" : "empty";
    case "F5.5":
      return deviation ? "partial" : "empty";
    case "F6.8":
      return ctx.project.status === "closed" ? "done" : "empty";
    case "F6.9":
      return knowledgeHere ? "partial" : "empty";
    default:
      return "empty";
  }
}

function rollup(statuses: LifecycleStatus[]): LifecycleStatus {
  if (statuses.every((item) => item === "done")) return "done";
  if (statuses.some((item) => item === "current")) return "current";
  if (statuses.some((item) => item === "partial" || item === "open")) return "partial";
  if (statuses.every((item) => item === "planned")) return "planned";
  return "open";
}

export function evaluateProcessLifecycle(ctx: LifecycleContext): EvaluatedPhase[] {
  const raw = PROCESS_STEPS.map((step) => {
    const done = completionOf(step.id, ctx);
    let status: LifecycleStatus;
    if (!step.inProduct && done === "empty") status = "planned";
    else if (!step.inProduct && done === "partial") status = "partial";
    else if (done === "done") status = "done";
    else if (done === "partial") status = "partial";
    else status = step.inProduct ? "open" : "planned";
    return { ...step, status };
  });

  const currentId = raw.find((item) => item.inProduct && item.status !== "done")?.id;
  const withCurrent: EvaluatedStep[] = raw.map((item) => {
    if (item.id !== currentId) return item;
    if (item.status === "done") return item;
    return { ...item, status: item.status === "partial" ? "partial" : "current" };
  });

  return PROCESS_PHASES.map((phase) => {
    const phaseSteps = withCurrent.filter((item) => item.phase === phase.id);
    const countable = phaseSteps.filter((item) => item.inProduct);
    const done = countable.filter((item) => item.status === "done").length;
    return {
      ...phase,
      steps: phaseSteps,
      done,
      total: countable.length || phaseSteps.length,
      status: rollup(phaseSteps.map((item) => item.status)),
    };
  });
}

export const LIFECYCLE_STATUS_LABEL: Record<LifecycleStatus, string> = {
  done: "Hecho en esta obra",
  current: "Siguiente paso",
  open: "Disponible",
  partial: "Parcial",
  planned: "Documentado, aún no en plataforma",
};
