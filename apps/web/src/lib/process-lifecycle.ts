import { areaReviewsComplete, partiesValidated, proposalReady } from "./kickoff";
import book from "./process-rev3.json";
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

/** Estado de un paso del flujo Rev3 respecto de esta obra. */
export type LifecycleStatus = "done" | "current" | "open" | "partial" | "planned";

export type ProcessPhaseId = "F0" | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7";

export interface ProcessStepDef {
  id: string;
  phase: ProcessPhaseId;
  name: string;
  description: string;
  pmbokGroup: string;
  knowledgeArea: string;
  responsible: string;
  inputs: string;
  outputs: string;
  requiredEvidence: string;
  predecessor: string[];
  successor: string[];
  decision: boolean;
  bifurcation: string;
  suggestedModule: string;
  /** Cómo lo resuelve OpenEVM hoy (prueba o pendiente). */
  inOpenEvm: string;
  href: string;
  /** Hay pantalla para probarlo. El paso igual forma parte del flujo válido. */
  readyForTest: boolean;
  /** @deprecated usar readyForTest */
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
  testReady: number;
  steps: EvaluatedStep[];
}

/** Libro Rev3: flujo válido de todo proyecto (56 pasos). F0 es alta de tenant, previa al contrato. */
export const PROCESS_SOURCE = book.source;

const F0_PHASE: ProcessPhaseDef = {
  id: "F0",
  name: "Alta del tenant",
  pmbok: "Previo al ciclo del contrato (OpenEVM)",
  goal: "Dejar la empresa, áreas y puestos listos antes de registrar una adjudicación.",
  entry: "Representante entra a la plataforma.",
  exit: "Tenant, áreas y perfiles guardados. Inicio muestra el ciclo del proyecto.",
};

const F0_STEP: ProcessStepDef = {
  id: "F0.1",
  phase: "F0",
  name: "Empresa, áreas y puestos",
  description: "Alta de la organización en OpenEVM. No forma parte de los 56 pasos del libro: es el prerrequisito de plataforma.",
  pmbokGroup: "Previo al ciclo del contrato (OpenEVM)",
  knowledgeArea: "Integración / RBAC",
  responsible: "Representante / administrador",
  inputs: "Datos de la empresa",
  outputs: "Tenant, áreas y perfiles",
  requiredEvidence: "Configuración guardada (opcional en pruebas)",
  predecessor: [],
  successor: ["F1.1"],
  decision: false,
  bifurcation: "",
  suggestedModule: "Setup / Administración",
  inOpenEvm: "Setup 0: representante, RUT, tamaño por áreas, perfiles y equipo.",
  href: "/admin",
  readyForTest: true,
  inProduct: true,
};

type RuntimeHint = { href: string; readyForTest: boolean; inOpenEvm: string };

/** Capa OpenEVM sobre el libro: qué se puede probar hoy. El flujo válido es siempre el Rev3. */
const OPENEVM_RUNTIME: Record<string, RuntimeHint> = {
  "F1.1": {
    href: "/clients",
    readyForTest: true,
    inOpenEvm: "Se registra el cliente y la carpeta de obra. El oficio PDF de adjudicación aún no es un documento aparte.",
  },
  "F1.2": {
    href: "/clients",
    readyForTest: true,
    inOpenEvm: "Comercial carga condiciones y el extracto de la propuesta. El loop de negociación legal (gate) no está modelado como módulo.",
  },
  "F1.3": {
    href: "/clients",
    readyForTest: true,
    inOpenEvm: "Tipo de contrato y garantías se anotan en el kickoff interno. Boletas y canje de fiel cumplimiento quedan para F6/F7.",
  },
  "F1.4": {
    href: "/teams",
    readyForTest: true,
    inOpenEvm: "En la obra se asigna el equipo. El independiente cubre todos los puestos.",
  },
  "F1.5": {
    href: "/clients",
    readyForTest: true,
    inOpenEvm: "Comercial sella alcance, plazos, costos/margen. El archivo de propuesta es opcional. Todas las áreas leen el mismo extracto.",
  },
  "F2.1": {
    href: "/demo",
    readyForTest: true,
    inOpenEvm: "Cada área involucrada deja por escrito las razones (viable / condicionado / no viable). Un documento de respaldo es opcional. Gate: inconsistencia bloquea el Día 1.",
  },
  "F2.2": {
    href: "/clients",
    readyForTest: true,
    inOpenEvm: "El gestor sintetiza el conocimiento de las áreas y cierra el kickoff interno. El Project Charter PDF no se emite.",
  },
  "F2.3": {
    href: "/clients",
    readyForTest: false,
    inOpenEvm: "Hoy solo está el cliente de la obra. Mandante adicional, comunidad o fiscalizadores no tienen módulo.",
  },
  "F2.4": {
    href: "/clients",
    readyForTest: true,
    inOpenEvm: "Kick-off de partida con el cliente (Día 1). Ese cierre abre el calendario.",
  },
  "F2.5": {
    href: "/profiles",
    readyForTest: true,
    inOpenEvm: "Los puestos salen de las áreas del tenant. No se publican letras RACI en pantalla.",
  },
  "F3.1": {
    href: "/gantt",
    readyForTest: true,
    inOpenEvm: "Plantilla CSV o alta: paquete, actividad, inspección e hito, con responsable de área.",
  },
  "F3.2": {
    href: "/gantt",
    readyForTest: true,
    inOpenEvm: "Fechas de inicio/término y línea base por elemento. Los desvíos se editan después sin borrar el plan original.",
  },
  "F3.3": {
    href: "/budget",
    readyForTest: true,
    inOpenEvm: "Finanzas propone el BAC; el gestor revisa; administrador o comercial da el visto bueno. PV/EV/AC en Inicio.",
  },
  "F3.4": {
    href: "/demo",
    readyForTest: false,
    inOpenEvm: "Paso del flujo válido. Aún no hay matriz de riesgos para prueba.",
  },
  "F3.5": {
    href: "/demo",
    readyForTest: false,
    inOpenEvm: "Hay puestos de Bodega y Subcontrato. El plan de compras aún no se carga como documento de fase.",
  },
  "F3.6": {
    href: "/evidence",
    readyForTest: false,
    inOpenEvm: "La calidad operativa de prueba es la evidencia validada de cada partida. El plan de calidad no está.",
  },
  "F3.7": {
    href: "/demo",
    readyForTest: false,
    inOpenEvm: "Inicio muestra qué le toca a cada puesto. No hay plan de informes aparte.",
  },
  "F3.8": {
    href: "/demo",
    readyForTest: false,
    inOpenEvm: "El plan vivo es la suma de kickoff + EDT + presupuesto. No hay un PDF único de plan de gestión.",
  },
  "F3.9": {
    href: "/baseline",
    readyForTest: false,
    inOpenEvm: "Cada actividad guarda su plan original. Gate de freeze (DRAFT → v1.0) pendiente. Rechazo debería volver a F3.1; F5.7 reingresa aquí.",
  },
  "F4.1": {
    href: "/gantt",
    readyForTest: false,
    inOpenEvm: "Paso del flujo válido. No hay acta de instalación de faena para prueba.",
  },
  "F4.2": {
    href: "/clients",
    readyForTest: false,
    inOpenEvm: "Permisos se pueden anotar en el kickoff interno. Gate de rechazo/subsanación de resoluciones no está. No es gestión de riesgos (eso es F3.4 / F5.9).",
  },
  "F4.3": {
    href: "/demo",
    readyForTest: false,
    inOpenEvm: "Bodega despacha; terreno pide material. Órdenes de compra e importación no están.",
  },
  "F4.4": {
    href: "/users",
    readyForTest: true,
    inOpenEvm: "Personas y puestos del tenant. Contratos laborales quedan fuera de la prueba actual.",
  },
  "F4.5": {
    href: "/progress",
    readyForTest: true,
    inOpenEvm: "Avance: terreno sube foto y las otras áreas suben PDF o planilla según el responsable del cronograma.",
  },
  "F4.6": {
    href: "/progress",
    readyForTest: true,
    inOpenEvm: "El puesto Subcontrato reporta solo sus partidas, con la misma regla de evidencia.",
  },
  "F4.7": {
    href: "/finance",
    readyForTest: false,
    inOpenEvm: "Pagos es placeholder. El costo real (AC) se anota al cargar avance o en Gastos.",
  },
  "F4.8": {
    href: "/evidence",
    readyForTest: false,
    inOpenEvm: "Hoy equivale a validar la evidencia. No hay actas de no conformidad aparte.",
  },
  "F4.9": {
    href: "/gantt",
    readyForTest: false,
    inOpenEvm: "La inducción al crear la primera obra cubre parte de la capacitación. No hay módulo de desempeño.",
  },
  "F4.10": {
    href: "/demo",
    readyForTest: true,
    inOpenEvm: "Inicio muestra EV, CPI, SPI y Curva S. Cortes de control periódicos siguen pendientes.",
  },
  "F5.1": {
    href: "/evidence",
    readyForTest: true,
    inOpenEvm: "Sin evidencia validada el EV no suma. Gate del libro: evidencia inválida vuelve a F4.5.",
  },
  "F5.2": {
    href: "/demo",
    readyForTest: true,
    inOpenEvm: "Motor en Inicio: PV, EV, AC a partir del cronograma, el BAC y los reportes validados.",
  },
  "F5.3": {
    href: "/demo",
    readyForTest: true,
    inOpenEvm: "Semáforos en Inicio. Gate: SPI/CPI fuera de umbral debería abrir F5.4.",
  },
  "F5.4": {
    href: "/gantt",
    readyForTest: true,
    inOpenEvm: "Se edita el desvío de fechas conservando la línea base. No hay acta de acción correctiva. El libro retorna en paralelo a F4.5.",
  },
  "F5.5": {
    href: "/gantt",
    readyForTest: false,
    inOpenEvm: "Los desvíos vs línea base se ven en el Gantt. No hay solicitud formal de aumento/disminución.",
  },
  "F5.6": {
    href: "/clients",
    readyForTest: false,
    inOpenEvm: "Gate: sin acuerdo económico la variación no entra y el control vuelve a F5.1. El anexo de contrato no está.",
  },
  "F5.7": {
    href: "/baseline",
    readyForTest: false,
    inOpenEvm: "Gate: cambio aprobado retorna a F3.9 para fijar el nuevo baseline. Freeze/replan v2.0 pendiente.",
  },
  "F5.8": {
    href: "/evidence",
    readyForTest: false,
    inOpenEvm: "Rechazar una evidencia obliga a volver a cargar avance (loop F5.1 → F4.5). No hay registro de NC.",
  },
  "F5.9": {
    href: "/demo",
    readyForTest: false,
    inOpenEvm: "Paso del flujo válido. Depende del plan F3.4.",
  },
  "F5.10": {
    href: "/demo",
    readyForTest: true,
    inOpenEvm: "El tablero de Inicio es el informe vivo. Cortes periódicos siguen pendientes.",
  },
  "F5.11": {
    href: "/demo",
    readyForTest: false,
    inOpenEvm: "Gate de entrada a F6: alcance 100% incluido variaciones. Si no, vuelve a F4.5. Aún no hay checklist de cierre de alcance.",
  },
  "F6.1": {
    href: "/progress",
    readyForTest: false,
    inOpenEvm: "Se puede respaldar como partida de inspección. No hay protocolo de commissioning.",
  },
  "F6.2": {
    href: "/projects",
    readyForTest: false,
    inOpenEvm: "Gate: con observaciones → F6.3; sin observaciones → F6.4 (TOP). El proyecto puede marcarse cerrado, sin acta.",
  },
  "F6.3": {
    href: "/progress",
    readyForTest: false,
    inOpenEvm: "Loop del libro hacia F6.2 hasta validar el punch list.",
  },
  "F6.4": {
    href: "/knowledge",
    readyForTest: false,
    inOpenEvm: "TOP del cliente, distinto del dossier interno (F6.10). Gate si el TOP está incompleto.",
  },
  "F6.5": {
    href: "/projects",
    readyForTest: false,
    inOpenEvm: "Paso del flujo válido. Recepción definitiva tras TOP aceptado.",
  },
  "F6.6": {
    href: "/finance",
    readyForTest: false,
    inOpenEvm: "Paso del flujo válido. Finiquito / estado de pago final.",
  },
  "F6.7": {
    href: "/finance",
    readyForTest: false,
    inOpenEvm: "Paso del flujo válido. Devolución o canje de boletas.",
  },
  "F6.8": {
    href: "/projects",
    readyForTest: false,
    inOpenEvm: "El estado Cerrado existe en el proyecto; el checklist de cierre administrativo no.",
  },
  "F6.9": {
    href: "/knowledge",
    readyForTest: true,
    inOpenEvm: "Las razones escritas de kickoff ya quedan en Conocimiento. Falta el registro de cierre del proyecto.",
  },
  "F6.10": {
    href: "/knowledge",
    readyForTest: false,
    inOpenEvm: "Dossier interno para postventa. No se mezcla con el TOP del cliente (F6.4).",
  },
  "F7.1": {
    href: "/knowledge",
    readyForTest: false,
    inOpenEvm: "Paso del flujo válido. Capacitación a postventa.",
  },
  "F7.2": {
    href: "/projects",
    readyForTest: false,
    inOpenEvm: "Activa garantía de instalación (operaciones) y de producto (comercial).",
  },
  "F7.3": {
    href: "/clients",
    readyForTest: false,
    inOpenEvm: "El kickoff permite anotar garantías, sin plazos de póliza.",
  },
  "F7.4": {
    href: "/demo",
    readyForTest: false,
    inOpenEvm: "Gate: mesa de solicitudes durante el período de garantía (instalación vs producto). Loop hasta F7.5.",
  },
  "F7.5": {
    href: "/projects",
    readyForTest: false,
    inOpenEvm: "Paso del flujo válido. Cierre del período de garantía.",
  },
  "F7.6": {
    href: "/projects",
    readyForTest: false,
    inOpenEvm: "Fin del flujo del libro Rev3. Archivo histórico.",
  },
};

export const PROCESS_PHASES: ProcessPhaseDef[] = [
  F0_PHASE,
  ...book.phases.map((phase) => ({
    id: phase.id as ProcessPhaseId,
    name: phase.name,
    pmbok: phase.pmbok,
    goal: phase.goal,
    entry: phase.entry,
    exit: phase.exit,
  })),
];

export const PROCESS_STEPS: ProcessStepDef[] = [
  F0_STEP,
  ...book.steps.map((step) => {
    const runtime = OPENEVM_RUNTIME[step.id] ?? {
      href: "/demo",
      readyForTest: false,
      inOpenEvm: "Paso del flujo válido. Módulo de prueba pendiente.",
    };
    return {
      id: step.id,
      phase: step.phase as ProcessPhaseId,
      name: step.name,
      description: step.description,
      pmbokGroup: step.pmbokGroup,
      knowledgeArea: step.knowledgeArea,
      responsible: step.responsible,
      inputs: step.inputs,
      outputs: step.outputs,
      requiredEvidence: step.requiredEvidence,
      predecessor: step.predecessor,
      successor: step.successor,
      decision: step.decision,
      bifurcation: step.bifurcation,
      suggestedModule: step.suggestedModule,
      inOpenEvm: runtime.inOpenEvm,
      href: runtime.href,
      readyForTest: runtime.readyForTest,
      inProduct: runtime.readyForTest,
    };
  }),
];

export const BOOK_STEP_COUNT = book.source.stepCount;
export const BOOK_DECISION_IDS = PROCESS_STEPS.filter((item) => item.decision).map((item) => item.id);

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
    if (!step.readyForTest && done === "empty") status = "planned";
    else if (!step.readyForTest && done === "partial") status = "partial";
    else if (done === "done") status = "done";
    else if (done === "partial") status = "partial";
    else status = step.readyForTest ? "open" : "planned";
    return { ...step, status };
  });

  const currentId = raw.find((item) => item.status !== "done")?.id;
  const withCurrent: EvaluatedStep[] = raw.map((item) => {
    if (item.id !== currentId) return item;
    if (item.status === "done") return item;
    return { ...item, status: item.status === "partial" ? "partial" : "current" };
  });

  return PROCESS_PHASES.map((phase) => {
    const phaseSteps = withCurrent.filter((item) => item.phase === phase.id);
    const done = phaseSteps.filter((item) => item.status === "done").length;
    return {
      ...phase,
      steps: phaseSteps,
      done,
      total: phaseSteps.length,
      testReady: phaseSteps.filter((item) => item.readyForTest).length,
      status: rollup(phaseSteps.map((item) => item.status)),
    };
  });
}

export const LIFECYCLE_STATUS_LABEL: Record<LifecycleStatus, string> = {
  done: "Hecho en esta obra",
  current: "Siguiente paso del flujo",
  open: "Listo para prueba",
  partial: "Parcial",
  planned: "En el flujo · módulo pendiente",
};
