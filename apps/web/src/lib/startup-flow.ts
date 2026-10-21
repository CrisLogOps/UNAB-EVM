import { ROLE_LABELS } from "./constants";
import { antecedentsReady, areasUserCanReview, partiesValidated, pendingAreas } from "./kickoff";
import type { TeamCoverageMode } from "./coverage";
import type {
  AtomicPermission,
  Client,
  CompanySize,
  OperatingMode,
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
  operatingMode: OperatingMode | "";
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

function isIndependentFlow(input: StartupFlowInput) {
  if (input.operatingMode === "collaborative") return false;
  if (input.operatingMode === "individual") return true;
  return input.companySize === "independent";
}

function contextCopy(input: StartupFlowInput) {
  const independent = isIndependentFlow(input);
  if (independent) {
    return "Como profesional independiente cubres el arranque: cliente, proyecto, antecedentes (documento El proyecto), kickoff interno con firma y kickoff con el cliente para cerrar la fase 1. El control se enciende con el cronograma y el valor ganado. Las minutas registran el gasto y las instrucciones. La pestaña Modo permite pasar a colaborativo sin rehacer el alta.";
  }
  if (input.coverageMode === "counterpart") {
    return "Hay contraparte. Cada perfil ve en Inicio lo que le falta; lo demás espera a la otra persona.";
  }
  return "La organización ya tiene puestos. En Inicio ves lo que te toca completar y lo que aún debe registrar otro perfil.";
}

export function buildStartupFlow(input: StartupFlowInput): StartupFlow {
  const realProject = input.project.id !== "prj-pending" && input.projects.length > 0;
  const kickoff = input.kickoff;
  const independent = isIndependentFlow(input);
  const commercialDone = Boolean(kickoff && antecedentsReady(kickoff));
  const commentsStarted = Boolean(kickoff?.areaReviews.length);
  const consultationDone = Boolean(kickoff?.internalDate && kickoff?.clientKickoffDueDate);
  const pmDone = independent
    ? Boolean(kickoff?.pmValidatedAt) || Boolean(kickoff && partiesValidated(kickoff))
    : consultationDone;
  const clientKickoffDone = input.project.kickoffPhase === "client_done";
  const kickoffBypassed = realProject && input.project.status !== "draft_kickoff" && !clientKickoffDone;
  const budgetLoaded =
    Boolean(input.project.bac) ||
    input.project.proposedBac != null ||
    input.project.status === "budget_proposed" ||
    input.project.status === "budget_counter" ||
    input.project.status === "pending_approval";
  const budgetReviewed = Boolean(input.project.bac) || input.project.status === "pending_approval";
  const budgetApproved = Boolean(input.project.bac);
  const scheduleDone = realProject && input.scheduleCount > 0;
  const showTeam = !independent;
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
      detail: "Nombre, código, fechas previstas y presupuesto inicial. Ese monto arma el cronograma.",
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
      yours: input.role === "owner",
      waitingOn: waitingLabel(input.users, "owner", input.ownerManagesAll),
      actionLabel: "Asignar equipo",
    });
  }

  if (independent) {
    drafts.push({
      id: "kickoff_commercial",
      code: "F1.5",
      title: "Kickoff interno",
      detail:
        "Con el documento El proyecto cargado, anotá el criterio PMBOK y formalizá con tu nombre antes del kickoff con el cliente.",
      href: "/clients",
      done: pmDone || kickoffBypassed,
      yours: true,
      waitingOn: "tú",
      actionLabel: "Abrir kickoff interno",
    });
  } else {
    drafts.push(
      {
        id: "kickoff_commercial",
        code: "F1.5",
        title: "Antecedentes del proyecto",
        detail:
          "Cargá el documento El proyecto con las condiciones del servicio vendido, y las partidas o consideraciones.",
        href: realProject ? "/demo" : "/clients",
        done: commercialDone || kickoffBypassed,
        yours: input.role === "owner" || input.role === "pmo" || input.role === "commercial",
        waitingOn: waitingLabel(input.users, "pmo", input.ownerManagesAll),
        actionLabel: realProject ? "Ver antecedentes" : "Cargar antecedentes",
      },
      {
        id: "kickoff_areas",
        code: "F2.1",
        title: "Comentarios de las áreas",
        detail:
          "Con el documento cargado, cada área completa los datos que necesita la gestión. El comentario no bloquea la firma.",
        href: "/demo",
        done: commercialDone || kickoffBypassed,
        yours:
          commercialDone &&
          !commentsStarted &&
          !consultationDone &&
          areasUserCanReview(input.sessionUser, input.areas, input.users, input.ownerManagesAll).some((area) =>
            pendingAreas(kickoff, input.areas).some((pending) => pending.id === area.id),
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
        title: "Fecha de consulta y comentarios del gestor",
        detail:
          "El administrador o el gestor fijan la consulta y formalizan el kickoff interno con su nombre.",
        href: "/clients",
        done: pmDone || kickoffBypassed,
        yours: input.role === "pmo" || input.role === "owner",
        waitingOn: waitingLabel(input.users, "pmo", input.ownerManagesAll),
        actionLabel: "Fijar plazo de consulta",
      },
    );
  }

  drafts.push(
    {
      id: "kickoff_client",
      code: "F2.4",
      title: "Kickoff con el cliente",
      detail: "Con los antecedentes y la firma interna, los acuerdos con el cliente cierran la fase 1.",
      href: "/clients",
      done: clientKickoffDone || kickoffBypassed,
      yours: input.role === "owner" || input.role === "pmo",
      waitingOn: waitingLabel(input.users, "pmo", input.ownerManagesAll),
      actionLabel: "Cerrar con el cliente",
    },
    {
      id: "budget_load",
      code: "F3.3",
      title: "Asignar presupuesto",
      detail: input.ownerManagesAll || !hasStaffRole(input.users, "finance")
        ? "El administrador carga el monto. El gestor no propone el presupuesto: lo revisa y, si cambia la cifra, adjunta evidencia."
        : "Finanzas carga el BAC en pesos. El gestor lo revisa después.",
      href: "/budget",
      done: budgetLoaded,
      yours: isActor(input.role, "finance", input.ownerManagesAll, input.users, ["owner"]),
      waitingOn: waitingLabel(input.users, "finance", input.ownerManagesAll),
      actionLabel: "Cargar presupuesto",
    },
    {
      id: "budget_review",
      code: "F3.3",
      title: "Revisar el presupuesto",
      detail: "El gestor acepta el monto o envía otra cifra con un archivo que fundamente el cambio. No carga el presupuesto.",
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
      title: "Cargar el cronograma",
      detail: "Se carga la plantilla EDT cuando hay presupuesto registrado. Las partidas heredan ese BAC.",
      href: "/gantt",
      done: scheduleDone,
      yours: isActor(input.role, "pmo", input.ownerManagesAll, input.users, ["owner", "pmo"]),
      waitingOn: waitingLabel(input.users, "pmo", input.ownerManagesAll),
      actionLabel: "Abrir cronograma",
    },
  );

  const lockedUntil: Record<StartupStepId, boolean> = {
    client: false,
    project: !drafts[0].done,
    team: !realProject,
    kickoff_commercial: !realProject,
    kickoff_areas: !commercialDone,
    kickoff_pm: !commercialDone,
    kickoff_client: !realProject,
    budget_load: !realProject,
    budget_review: !budgetLoaded,
    budget_approve: !budgetReviewed,
    schedule: !budgetLoaded,
  };

  const currentId = drafts.find((step) => !step.done && !lockedUntil[step.id])?.id;
  const steps: StartupStep[] = drafts.map((step) => ({
    ...step,
    current: step.id === currentId,
  }));

  const next = steps.find((item) => item.current);
  const controlReady = clientKickoffDone && scheduleDone;

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
