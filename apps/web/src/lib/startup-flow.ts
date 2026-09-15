import { ROLE_LABELS } from "./constants";
import { areaReviewsComplete, areasUserCanReview, evaluateInternalGate, partiesValidated, pendingAreas, proposalReady } from "./kickoff";
import type { TeamCoverageMode } from "./coverage";
import type {
  AtomicPermission,
  Client,
  CompanySize,
  OrgArea,
  Project,
  ProjectKickoff,
  TenantUser,
  UserRole,
} from "./types";

/** Primera pantalla de todos los perfiles tras el setup y al cambiar «Ver como». */
export const HOME_HREF = "/demo";

export type StartupStepId =
  | "client"
  | "project"
  | "team"
  | "kickoff_commercial"
  | "kickoff_areas"
  | "kickoff_pm"
  | "kickoff_client"
  | "budget_load"
  | "budget_review"
  | "budget_approve"
  | "schedule";

export interface StartupStep {
  id: StartupStepId;
  code: string;
  title: string;
  detail: string;
  href: string;
  done: boolean;
  current: boolean;
  yours: boolean;
  waitingOn: string;
  actionLabel: string;
}

export interface StartupFlow {
  headline: string;
  context: string;
  roleTitle: string;
  steps: StartupStep[];
  next?: StartupStep;
  controlReady: boolean;
  budgetReady: boolean;
}

export interface StartupFlowInput {
  companySize: CompanySize | "";
  coverageMode: TeamCoverageMode;
  ownerManagesAll: boolean;
  role: UserRole;
  sessionUser: TenantUser;
  clients: Client[];
  projects: Project[];
  project: Project;
  kickoff?: ProjectKickoff;
  areas: OrgArea[];
  scheduleCount: number;
  assignmentCount: number;
  users: TenantUser[];
  canOperate: (permission: AtomicPermission) => boolean;
}

function hasStaffRole(users: TenantUser[], role: UserRole) {
  return users.some((item) => item.active && item.profileId && item.role === role);
}

function personFor(users: TenantUser[], role: UserRole) {
  return users.find((item) => item.active && item.profileId && item.role === role);
}

function waitingLabel(users: TenantUser[], preferred: UserRole, ownerManagesAll: boolean) {
  if (ownerManagesAll) return "tú";
  const person = personFor(users, preferred);
  if (person) return `${person.name || person.email} · ${ROLE_LABELS[preferred]}`;
  const owner = personFor(users, "owner") ?? users.find((item) => item.role === "owner");
  if (preferred !== "owner" && owner) {
    return `${ROLE_LABELS[preferred]} (vacante) · lo cubre ${owner.name || "el administrador"}`;
  }
  return ROLE_LABELS[preferred];
}

function isActor(
  role: UserRole,
  preferred: UserRole,
  ownerManagesAll: boolean,
  users: TenantUser[],
  vacantFallback: UserRole[] = ["owner"],
) {
  if (ownerManagesAll) return role === "owner";
  if (hasStaffRole(users, preferred)) return role === preferred;
  return vacantFallback.includes(role);
}

function contextCopy(input: StartupFlowInput) {
  const independent = input.companySize === "independent" || input.coverageMode === "solo";
  if (independent) {
    return "Como profesional independiente cubres todo el arranque: cliente, proyecto, lo que se vendió, presupuesto y calendario. El control de la obra se enciende cuando eso está listo.";
  }
  if (input.coverageMode === "counterpart") {
    return "Hay contraparte. Cada perfil ve en Inicio lo que le falta; lo demás espera a la otra persona.";
  }
  return "La organización ya tiene puestos. En Inicio ves lo que te toca completar y lo que aún debe registrar otro perfil.";
}

export function buildStartupFlow(input: StartupFlowInput): StartupFlow {
  const realProject = input.project.id !== "prj-pending" && input.projects.length > 0;
  const kickoff = input.kickoff;
  const commercialDone = Boolean(kickoff?.commercialDeliveredAt) || Boolean(kickoff && proposalReady(kickoff.proposal));
  const gate = kickoff ? evaluateInternalGate(kickoff, input.areas) : undefined;
  const areasDone = Boolean(kickoff && areaReviewsComplete(kickoff, input.areas));
  const pmDone = Boolean(kickoff?.pmValidatedAt) || Boolean(kickoff && partiesValidated(kickoff));
  const clientKickoffDone = input.project.kickoffPhase === "client_done";
  const internalReady = Boolean(gate?.canMeetClient);
  const budgetLoaded =
    Boolean(input.project.bac) ||
    input.project.proposedBac != null ||
    input.project.status === "budget_proposed" ||
    input.project.status === "budget_counter" ||
    input.project.status === "pending_approval";
  const budgetReviewed = Boolean(input.project.bac) || input.project.status === "pending_approval";
  const budgetApproved = Boolean(input.project.bac);
  const scheduleDone = clientKickoffDone && input.scheduleCount > 0;
  const showTeam = input.companySize !== "independent" && input.coverageMode !== "solo";
  const teamDone = input.assignmentCount > 0;

  const drafts: Omit<StartupStep, "current">[] = [
    {
      id: "client",
      code: "F1.1",
      title: "Registrar cliente",
      detail: "Razón social y RUT. Sin cliente no hay carpeta de obra.",
      href: "/clients",
      done: input.clients.length > 0,
      yours: isActor(input.role, "commercial", input.ownerManagesAll, input.users, ["owner", "pmo", "commercial"]),
      waitingOn: waitingLabel(input.users, hasStaffRole(input.users, "commercial") ? "commercial" : "pmo", input.ownerManagesAll),
      actionLabel: "Registrar cliente",
    },
    {
      id: "project",
      code: "F1.1",
      title: "Crear el proyecto",
      detail: "Nombre, código y fechas previstas de la obra.",
      href: "/clients",
      done: realProject,
      yours: isActor(input.role, "pmo", input.ownerManagesAll, input.users, ["owner", "pmo", "commercial"]),
      waitingOn: waitingLabel(input.users, "pmo", input.ownerManagesAll),
      actionLabel: "Crear proyecto",
    },
  ];

  if (showTeam) {
    drafts.push({
      id: "team",
      code: "F1.4",
      title: "Asignar quién está en la obra",
      detail: "Elige las personas del equipo que trabajarán este proyecto.",
      href: "/teams",
      done: !realProject ? false : teamDone,
      yours: input.role === "owner" || (input.ownerManagesAll && input.role === "owner"),
      waitingOn: waitingLabel(input.users, "owner", input.ownerManagesAll),
      actionLabel: "Asignar equipo",
    });
  }

  drafts.push(
    {
      id: "kickoff_commercial",
      code: "F1.5",
      title: "Propuesta inicial de Comercial",
      detail: "Escribe el extracto de lo vendido. El archivo es opcional.",
      href: realProject ? "/demo" : "/clients",
      done: commercialDone,
      yours: isActor(input.role, "commercial", input.ownerManagesAll, input.users, ["owner", "pmo", "commercial"]),
      waitingOn: waitingLabel(input.users, "commercial", input.ownerManagesAll),
      actionLabel: realProject ? "Escribir extracto" : "Cargar propuesta",
    },
    {
      id: "kickoff_areas",
      code: "F2.1",
      title: "Validación crítica de las áreas",
      detail: "Cada área involucrada deja por escrito por qué se justifica el proyecto. Un documento de respaldo es opcional. Sin esas razones no hay kickoff con el cliente.",
      href: "/demo",
      done: areasDone,
      yours:
        commercialDone &&
        !areasDone &&
        areasUserCanReview(input.sessionUser, input.areas, input.ownerManagesAll).some((area) =>
          pendingAreas(kickoff ?? { areaReviews: [] } as ProjectKickoff, input.areas).some(
            (pending) => pending.id === area.id,
          ),
        ),
      waitingOn: kickoff
        ? pendingAreas(kickoff, input.areas)
            .map((item) => item.name)
            .join(", ") || "las áreas"
        : "las áreas",
      actionLabel: "Comentar en Inicio",
    },
    {
      id: "kickoff_pm",
      code: "F2.2",
      title: "Kickoff interno · juicio del gestor",
      detail: "El gestor sintetiza el conocimiento de las áreas. Solo cierra si el criterio crítico lo permite.",
      href: "/clients",
      done: pmDone,
      yours: isActor(input.role, "pmo", input.ownerManagesAll, input.users, ["owner", "pmo"]),
      waitingOn: waitingLabel(input.users, "pmo", input.ownerManagesAll),
      actionLabel: "Confirmar como gestor",
    },
    {
      id: "kickoff_client",
      code: "F2.4",
      title: "Kickoff con el cliente",
      detail: "Cierra acuerdos con el cliente. Ahí se abre el cronograma.",
      href: "/clients",
      done: clientKickoffDone,
      yours: isActor(input.role, "pmo", input.ownerManagesAll, input.users, ["owner", "pmo", "commercial"]),
      waitingOn: waitingLabel(input.users, "pmo", input.ownerManagesAll),
      actionLabel: "Cerrar con el cliente",
    },
    {
      id: "budget_load",
      code: "F3.3",
      title: "Asignar presupuesto",
      detail: input.ownerManagesAll
        ? "Carga el monto de la obra. Sin presupuesto el control mide plazo, no costo."
        : "Finanzas (o quien cubra) carga el BAC en pesos.",
      href: "/budget",
      done: budgetLoaded,
      yours: isActor(input.role, "finance", input.ownerManagesAll, input.users, ["owner", "pmo", "finance"]),
      waitingOn: waitingLabel(input.users, "finance", input.ownerManagesAll),
      actionLabel: "Cargar presupuesto",
    },
    {
      id: "budget_review",
      code: "F3.3",
      title: "Revisar el presupuesto",
      detail: "El gestor acepta el monto o propone otro.",
      href: "/budget-review",
      done: budgetReviewed,
      yours: isActor(input.role, "pmo", input.ownerManagesAll, input.users, ["owner", "pmo"]),
      waitingOn: waitingLabel(input.users, "pmo", input.ownerManagesAll),
      actionLabel: "Revisar monto",
    },
    {
      id: "budget_approve",
      code: "F3.3",
      title: "Aprobar el presupuesto",
      detail: "El administrador da el visto bueno. Comercial puede cerrar junto con él. El gestor no aprueba: solo revisa y envía.",
      href: "/budget-approval",
      done: budgetApproved,
      yours: input.role === "owner" || input.role === "commercial",
      waitingOn: hasStaffRole(input.users, "commercial")
        ? `${ROLE_LABELS.owner} o ${ROLE_LABELS.commercial}`
        : waitingLabel(input.users, "owner", input.ownerManagesAll),
      actionLabel: "Dar visto bueno",
    },
    {
      id: "schedule",
      code: "F3.1",
      title: "Cargar el calendario",
      detail: "Actividades con inicio y término (F3.1–F3.2). Con eso arranca el control (curva S, CPI y SPI).",
      href: "/gantt",
      done: scheduleDone,
      yours: isActor(input.role, "pmo", input.ownerManagesAll, input.users, ["owner", "pmo"]),
      waitingOn: waitingLabel(input.users, "pmo", input.ownerManagesAll),
      actionLabel: "Abrir calendario",
    },
  );

  const lockedUntil: Record<StartupStepId, boolean> = {
    client: false,
    project: !drafts[0].done,
    team: !realProject,
    kickoff_commercial: !realProject,
    kickoff_areas: !commercialDone,
    kickoff_pm: !areasDone,
    kickoff_client: !internalReady,
    budget_load: !realProject,
    budget_review: !budgetLoaded,
    budget_approve: !budgetReviewed,
    schedule: !clientKickoffDone,
  };

  const currentId = drafts.find((step) => !step.done && !lockedUntil[step.id])?.id;
  const steps: StartupStep[] = drafts.map((step) => ({
    ...step,
    current: step.id === currentId,
  }));

  const next = steps.find((item) => item.current);
  const controlReady = clientKickoffDone && scheduleDone;
  const independent = input.companySize === "independent" || input.coverageMode === "solo";

  let headline = `Hola, ${ROLE_LABELS[input.role]}`;
  if (next?.yours) headline = `Te toca: ${next.title.toLowerCase()}`;
  else if (next) headline = `En espera: ${next.title.toLowerCase()}`;
  else if (controlReady && budgetApproved) headline = "El flujo inicial está completo";
  else if (controlReady) headline = "El cronograma está listo; falta el presupuesto para controlar costo";

  return {
    headline,
    context: contextCopy(input),
    roleTitle: independent ? "Profesional independiente" : ROLE_LABELS[input.role],
    steps,
    next,
    controlReady,
    budgetReady: budgetApproved,
  };
}
