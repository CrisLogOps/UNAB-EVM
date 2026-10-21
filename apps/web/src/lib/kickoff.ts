import type {
  Client,
  CommercialFit,
  KickoffPhase,
  KickoffProposal,
  KickoffAntecedentItem,
  KickoffAreaReview,
  KickoffReviewStance,
  KnowledgeEntry,
  OrgArea,
  Project,
  ProjectKickoff,
  ProjectStatus,
  TenantUser,
  UserRole,
} from "./types";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft_kickoff: "Kickoff",
  awaiting_budget: "Espera Finanzas",
  budget_proposed: "Presupuesto cargado",
  budget_counter: "Contrapropuesta",
  pending_approval: "Espera visto bueno",
  active: "Activo",
  closed: "Cerrado",
};

export const KICKOFF_PHASE_LABEL: Record<KickoffPhase, string> = {
  none: "Sin kickoff",
  internal_pending: "Extracto de lo vendido",
  awaiting_areas: "Áreas comentan",
  awaiting_pm: "Consulta en curso",
  internal_done: "Listo para el cliente",
  client_done: "Proyecto iniciado",
};

export const REVIEW_STANCE_OPTIONS: { id: KickoffReviewStance; label: string; hint: string }[] = [
  {
    id: "ok",
    label: "Viabilidad confirmada",
    hint: "El área justifica, por escrito, que se puede desarrollar lo propuesto.",
  },
  {
    id: "adjust",
    label: "Viabilidad con condiciones",
    hint: "Se puede desarrollar si se incorporan los ajustes de esta área antes del cliente.",
  },
  {
    id: "block",
    label: "No viable aún",
    hint: "Hay una observación crítica. No se puede pasar al kickoff con el cliente hasta resolverla.",
  },
];

export const MIN_AREA_JUSTIFICATION = 20;
export const MIN_INDIVIDUAL_EVAL = 20;

export interface IndividualKickoffQuestion {
  id: string;
  knowledgeArea: string;
  question: string;
  hint: string;
}

/** Criterio PMBOK para kickoff interno sin contrapartes de área. */
export const INDIVIDUAL_KICKOFF_QUESTIONS: IndividualKickoffQuestion[] = [
  {
    id: "integration",
    knowledgeArea: "Integración",
    question: "¿Cuál es el objetivo del proyecto y cómo sabrás que se cumplió lo vendido?",
    hint: "Criterio de éxito en una o dos frases, alineado a la propuesta comercial.",
  },
  {
    id: "scope",
    knowledgeArea: "Alcance",
    question: "¿Qué está incluido en lo vendido y qué queda explícitamente fuera?",
    hint: "Límites del trabajo. Esto se valida con el cliente en el Día 1.",
  },
  {
    id: "schedule",
    knowledgeArea: "Cronograma",
    question: "¿Las fechas vendidas son realistas para ejecutarlo sin equipo interno en la plataforma?",
    hint: "Hitos, holguras y qué hay que confirmar con el mandante.",
  },
  {
    id: "cost",
    knowledgeArea: "Costos",
    question: "¿Con qué presupuesto de control vas a medir el costo de la obra?",
    hint: "Monto o criterio (BAC / estimado). No hay Finanzas aparte: lo defines tú.",
  },
  {
    id: "quality",
    knowledgeArea: "Calidad",
    question: "¿Qué evidencias vas a conservar para demostrar al cliente el cumplimiento?",
    hint: "Fotos, actas, mediciones. Es el repositorio contractual, no una aprobación de un tercero interno.",
  },
  {
    id: "risk",
    knowledgeArea: "Riesgos",
    question: "¿Qué supuestos o riesgos debes validar en el kickoff con el cliente?",
    hint: "Permisos, acceso a faena, interferencias, pagos, clima, terceros en terreno.",
  },
  {
    id: "stakeholders",
    knowledgeArea: "Interesados",
    question: "¿Quién es la contraparte del cliente y cómo se comunican los acuerdos?",
    hint: "Nombre o rol en el mandante, canal y frecuencia. No hay interesados internos que firmen aquí.",
  },
];

export type KickoffVerdict = "incomplete" | "nogo" | "conditional" | "go";

export const VERDICT_LABEL: Record<KickoffVerdict, string> = {
  incomplete: "Consulta en curso",
  nogo: "No se puede pasar al cliente",
  conditional: "Comentarios pendientes",
  go: "Listo para el kickoff con el cliente",
};

export interface InternalKickoffGate {
  verdict: KickoffVerdict;
  pending: OrgArea[];
  blockers: OrgArea[];
  conditions: OrgArea[];
  reasons: string[];
  canCloseInternal: boolean;
  canMeetClient: boolean;
}

export function emptyProposal(): KickoffProposal {
  return {
    title: "",
    fileName: "",
    fileType: "",
    fileSize: 0,
    uploadedBy: "",
    uploadedAt: null,
    body: "",
  };
}

export function proposalReady(proposal: KickoffProposal | undefined) {
  return Boolean(proposal?.body?.trim());
}

export function normalizeAntecedentItem(raw: Partial<KickoffAntecedentItem>): KickoffAntecedentItem {
  return {
    id: raw.id ?? `ant-${Date.now()}`,
    kind: raw.kind === "partida" ? "partida" : "consideracion",
    title: raw.title ?? "",
    detail: raw.detail ?? "",
  };
}

/** Documento El proyecto más las condiciones del servicio vendido. */
export function antecedentsReady(kickoff: Pick<ProjectKickoff, "proposal"> | undefined) {
  const body = kickoff?.proposal?.body?.trim() ?? "";
  return body.length >= 20 && Boolean(kickoff?.proposal?.fileName?.trim());
}

export const COMMERCIAL_FIT_OPTIONS: { id: Exclude<CommercialFit, "">; label: string; hint: string }[] = [
  {
    id: "within",
    label: "Dentro de las expectativas",
    hint: "Lo vendido se puede ejecutar con el plan y el equipo actuales.",
  },
  {
    id: "adjust",
    label: "Se puede cumplir con ajustes",
    hint: "Hay que cambiar plazos, recursos o alcance interno para honrar lo vendido.",
  },
  {
    id: "gap",
    label: "Fuera de expectativas",
    hint: "No se puede cumplir tal cual: hay que renegociar con Comercial o con el cliente.",
  },
];

export function emptyKickoff(projectId: string, clientId: string): ProjectKickoff {
  return {
    id: `ko-${projectId}`,
    projectId,
    clientId,
    commercialCommitment: "",
    commercialConditions: "",
    exclusions: "",
    requirements: "",
    soldStartDate: "",
    soldFinishDate: "",
    commercialDeliveredBy: "",
    commercialDeliveredAt: null,
    proposal: emptyProposal(),
    areaReviews: [],
    finalProposalToClient: "",
    plannedStartDate: "",
    plannedFinishDate: "",
    siteStartDate: "",
    legalAspects: "",
    contractType: "",
    guarantees: "",
    permits: "",
    workingAgreement: "",
    teamValidatedUserIds: [],
    internalEvalAnswers: {},
    internalDate: "",
    clientKickoffDueDate: "",
    internalNotes: "",
    pmFit: "",
    pmJudgment: "",
    pmFulfillmentPlan: "",
    pmValidatedBy: "",
    pmValidatedAt: null,
    internalConfirmedAt: null,
    antecedentItems: [],
    internalSignerName: "",
    internalSignedAt: null,
    baselineScheduleName: "",
    clientDate: "",
    clientAttendees: "",
    clientAgreements: "",
    clientConfirmedAt: null,
    paymentsAgreed: null,
    paymentNote: "",
    paymentDates: [],
  };
}

export function normalizeKickoff(raw: Partial<ProjectKickoff> | undefined, projectId: string, clientId: string): ProjectKickoff {
  const base = {
    ...emptyKickoff(projectId, clientId),
    ...raw,
    projectId: raw?.projectId ?? projectId,
    clientId: raw?.clientId ?? clientId,
    teamValidatedUserIds: raw?.teamValidatedUserIds ?? [],
    internalEvalAnswers: normalizeEvalAnswers(raw?.internalEvalAnswers),
    commercialDeliveredAt: raw?.commercialDeliveredAt ?? null,
    proposal: {
      ...emptyProposal(),
      ...(raw?.proposal ?? {}),
    },
    areaReviews: (raw?.areaReviews ?? []).map(normalizeAreaReview),
    finalProposalToClient: raw?.finalProposalToClient ?? "",
    pmValidatedAt: raw?.pmValidatedAt ?? null,
    internalConfirmedAt: raw?.internalConfirmedAt ?? null,
    antecedentItems: (raw?.antecedentItems ?? []).map(normalizeAntecedentItem),
    internalSignerName: raw?.internalSignerName ?? "",
    internalSignedAt: raw?.internalSignedAt ?? null,
    baselineScheduleName: raw?.baselineScheduleName ?? "",
    clientConfirmedAt: raw?.clientConfirmedAt ?? null,
    pmFit: raw?.pmFit ?? "",
    clientKickoffDueDate: raw?.clientKickoffDueDate ?? "",
    internalDate: raw?.internalDate ?? "",
    paymentsAgreed: raw?.paymentsAgreed === true ? true : raw?.paymentsAgreed === false ? false : null,
    paymentNote: raw?.paymentNote ?? "",
    paymentDates: Array.isArray(raw?.paymentDates)
      ? raw.paymentDates.filter((item): item is string => typeof item === "string" && Boolean(item))
      : [],
  };
  if (base.internalConfirmedAt && !base.commercialDeliveredAt) {
    base.commercialDeliveredAt = base.internalConfirmedAt;
    base.pmValidatedAt = base.pmValidatedAt ?? base.internalConfirmedAt;
  }
  return base;
}

export function normalizeAreaReview(raw: Partial<KickoffAreaReview>): KickoffAreaReview {
  return {
    id: raw.id ?? "",
    areaId: raw.areaId ?? "",
    areaName: raw.areaName ?? "",
    role: raw.role ?? "viewer",
    userId: raw.userId ?? "",
    stance: raw.stance ?? "ok",
    comment: raw.comment ?? "",
    evidenceFileName: raw.evidenceFileName ?? "",
    evidenceFileType: raw.evidenceFileType ?? "",
    evidenceFileSize: raw.evidenceFileSize ?? 0,
    knowledgeRefs: raw.knowledgeRefs ?? [],
    recordedAt: raw.recordedAt ?? "",
  };
}

export function commercialDeliveryReady(kickoff: ProjectKickoff) {
  return proposalReady(kickoff.proposal) || Boolean(kickoff.commercialCommitment?.trim());
}

export function involvedAreas(areas: OrgArea[]) {
  const enabled = areas.filter((item) => item.enabled);
  return enabled.length ? enabled : areas.slice(0, 1);
}

export function areaReviewFor(kickoff: ProjectKickoff, areaId: string) {
  return kickoff.areaReviews.find((item) => item.areaId === areaId);
}

export function areaReviewValid(review: KickoffAreaReview | undefined) {
  return (review?.comment?.trim().length ?? 0) >= MIN_AREA_JUSTIFICATION;
}

export function pendingAreas(kickoff: ProjectKickoff | undefined, areas: OrgArea[]) {
  if (!kickoff) return involvedAreas(areas);
  return involvedAreas(areas).filter((area) => !areaReviewValid(areaReviewFor(kickoff, area.id)));
}

export function blockingAreas(kickoff: ProjectKickoff, areas: OrgArea[]) {
  return involvedAreas(areas).filter((area) => areaReviewFor(kickoff, area.id)?.stance === "block");
}

export function adjustingAreas(kickoff: ProjectKickoff, areas: OrgArea[]) {
  return involvedAreas(areas).filter((area) => areaReviewFor(kickoff, area.id)?.stance === "adjust");
}

export function areaReviewsComplete(kickoff: ProjectKickoff, areas: OrgArea[]) {
  return pendingAreas(kickoff, areas).length === 0 && involvedAreas(areas).length > 0;
}

export function normalizeEvalAnswers(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    next[key] = String(value ?? "");
  }
  return next;
}

export function individualEvalComplete(kickoff: ProjectKickoff) {
  return INDIVIDUAL_KICKOFF_QUESTIONS.every(
    (item) => (kickoff.internalEvalAnswers?.[item.id] ?? "").trim().length >= MIN_INDIVIDUAL_EVAL,
  );
}

export function individualInternalReady(kickoff: ProjectKickoff) {
  const sold = antecedentsReady(kickoff);
  const notes = (kickoff.internalNotes ?? "").trim().length >= MIN_INDIVIDUAL_EVAL;
  return sold && notes && individualEvalComplete(kickoff);
}

export function composeIndividualJudgment(kickoff: ProjectKickoff) {
  const notes = kickoff.internalNotes.trim();
  const lines = INDIVIDUAL_KICKOFF_QUESTIONS.map((item) => {
    const answer = (kickoff.internalEvalAnswers?.[item.id] ?? "").trim();
    return answer ? `· ${item.knowledgeArea}: ${answer}` : "";
  }).filter(Boolean);
  return [notes, lines.join("\n")].filter(Boolean).join("\n\n");
}

export function evaluateInternalGate(
  kickoff: ProjectKickoff,
  areas: OrgArea[],
  independent = false,
): InternalKickoffGate {
  if (independent) {
    const sold = antecedentsReady(kickoff);
    const reasons: string[] = [];
    if (!sold) reasons.push("Carga el documento El proyecto y las condiciones del servicio vendido en antecedentes.");
    if (!kickoff.internalSignedAt) reasons.push("Formaliza el kickoff interno con el nombre de quien firma.");
    if ((kickoff.internalNotes ?? "").trim().length < MIN_INDIVIDUAL_EVAL) {
      reasons.push("Anota lo que vas a validar con el cliente en el kickoff de partida.");
    }
    if (!individualEvalComplete(kickoff)) {
      reasons.push("Completá el criterio PMBOK (todas las preguntas) antes de ir con el cliente.");
    }
    const ready = reasons.length === 0;
    const stamped = Boolean(kickoff.commercialDeliveredAt && kickoff.pmValidatedAt);
    return {
      verdict: ready ? "go" : "incomplete",
      pending: [],
      blockers: [],
      conditions: [],
      reasons,
      canCloseInternal: ready,
      canMeetClient: ready && stamped,
    };
  }
  const pending = pendingAreas(kickoff, areas);
  const reasons: string[] = [];
  const sold = antecedentsReady(kickoff);
  if (!sold) {
    reasons.push("Carga el documento El proyecto y las condiciones del servicio vendido en antecedentes.");
  }
  if (!kickoff.internalSignedAt) {
    reasons.push("Formaliza el kickoff interno con el nombre de quien firma.");
  }
  if (!kickoff.internalDate) {
    reasons.push("Fija la fecha de consulta interna a las áreas.");
  }
  if (!kickoff.clientKickoffDueDate) {
    reasons.push("Fija el plazo del kickoff con el cliente.");
  }
  const ready = reasons.length === 0;
  if (pending.length) {
    reasons.push(
      `Comentarios aún no registrados (no bloquean el avance): ${pending.map((item) => item.name).join(", ")}.`,
    );
  }

  return {
    verdict: ready ? "go" : "incomplete",
    pending,
    blockers: [],
    conditions: [],
    reasons,
    canCloseInternal: ready,
    canMeetClient: ready,
  };
}

export function collaborativeInternalReadyExtract(kickoff: ProjectKickoff) {
  return proposalReady(kickoff.proposal) || Boolean(kickoff.commercialCommitment?.trim());
}

export function collaborativeInternalReady(kickoff: ProjectKickoff) {
  return (
    collaborativeInternalReadyExtract(kickoff) &&
    Boolean(kickoff.internalDate) &&
    Boolean(kickoff.clientKickoffDueDate)
  );
}

export function addCalendarDays(iso: string, days: number) {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function roleIsStaffed(users: TenantUser[], role: UserRole) {
  return users.some((item) => item.active && item.profileId && item.role === role);
}

/** Un solo trabajador operativo: no hay otro puesto entregado. El administrador cubre el levantamiento. */
export function isSoleOperator(users: TenantUser[]) {
  return !users.some(
    (item) => item.active && item.profileId && item.role !== "owner" && item.role !== "viewer",
  );
}

export function actsAsSoleOperator(users: TenantUser[], ownerManagesAll: boolean) {
  return ownerManagesAll || isSoleOperator(users);
}

/** Actúa un rol de kickoff si es ese puesto, o si es el único trabajador. Con más integrantes no cubre vacantes. */
export function coversKickoffRole(
  user: TenantUser,
  preferred: UserRole,
  users: TenantUser[],
  ownerManagesAll: boolean,
) {
  if (user.role === preferred) return true;
  if (!actsAsSoleOperator(users, ownerManagesAll)) return false;
  return user.role === "owner";
}

/** Extracto de lo vendido: administrador y gestor lo registran. Comercial solo si existe el puesto. */
export function canEditSoldExtract(user: TenantUser, users: TenantUser[], ownerManagesAll: boolean) {
  if (user.role === "owner" || user.role === "pmo" || user.role === "commercial") return true;
  return actsAsSoleOperator(users, ownerManagesAll);
}

/** Comentarios del gestor: se editan, no cierran el flujo. */
export function canEditPmNotes(user: TenantUser, users: TenantUser[], ownerManagesAll: boolean) {
  if (user.role === "pmo" || user.role === "owner") return true;
  return actsAsSoleOperator(users, ownerManagesAll);
}

export function counterpartForArea(area: OrgArea, users: TenantUser[]) {
  return users.find(
    (item) =>
      item.active &&
      item.profileId &&
      item.role !== "owner" &&
      (item.areaId === area.id || item.role === area.role),
  );
}

export function areaHasCounterpart(area: OrgArea, users: TenantUser[]) {
  return Boolean(counterpartForArea(area, users));
}

export function areasNeedingCounterpart(areas: OrgArea[], users: TenantUser[], ownerAreaId?: string) {
  return involvedAreas(areas).filter((area) => {
    if (area.role === "owner" || area.id === ownerAreaId) return false;
    return !areaHasCounterpart(area, users);
  });
}

export function areasUserCanReview(
  user: TenantUser,
  areas: OrgArea[],
  users: TenantUser[],
  ownerManagesAll: boolean,
) {
  const involved = involvedAreas(areas);
  if (actsAsSoleOperator(users, ownerManagesAll) || user.role === "owner" || user.role === "pmo") {
    return involved;
  }
  return involved.filter((area) => area.id === user.areaId || area.role === user.role);
}

export function composeAreaComments(reviews: KickoffAreaReview[]) {
  if (!reviews.length) return "";
  return reviews
    .map((item) => {
      const evidence = item.evidenceFileName ? ` [evidencia: ${item.evidenceFileName}]` : "";
      return `· ${item.areaName}: ${item.comment}${evidence}`;
    })
    .join("\n");
}

export function relatedKnowledge(
  entries: KnowledgeEntry[],
  areaId: string,
  projectId: string,
  activityType?: string,
) {
  return entries
    .filter((item) => item.areaId === areaId && item.projectId !== projectId)
    .filter((item) => !activityType || item.activityType === activityType)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 3);
}

export function draftFinalProposal(kickoff: ProjectKickoff) {
  if (kickoff.finalProposalToClient.trim()) return kickoff.finalProposalToClient;
  const comments = composeAreaComments(kickoff.areaReviews);
  return [kickoff.commercialCommitment.trim(), comments ? `Comentarios de las áreas:\n${comments}` : ""]
    .filter(Boolean)
    .join("\n\n");
}

export function partiesValidated(kickoff: ProjectKickoff) {
  return Boolean(kickoff.commercialDeliveredAt && kickoff.pmValidatedAt);
}

export function internalReadyForClient(kickoff: ProjectKickoff, areas: OrgArea[], independent = false) {
  return evaluateInternalGate(kickoff, areas, independent).canMeetClient;
}

export function pmReviewReady(kickoff: ProjectKickoff) {
  const datesOk = Boolean(kickoff.plannedStartDate && kickoff.plannedFinishDate);
  const judgmentOk = Boolean(kickoff.pmFit && kickoff.pmJudgment?.trim());
  const fulfillmentOk = kickoff.pmFit === "within" || Boolean(kickoff.pmFulfillmentPlan?.trim());
  const synthesisOk = Boolean(kickoff.finalProposalToClient?.trim());
  return datesOk && judgmentOk && fulfillmentOk && synthesisOk;
}

export function defaultWorkingAgreement(areas: OrgArea[]) {
  const enabled = areas.filter((item) => item.enabled);
  if (!enabled.length) {
    return "El administrador o el gestor registran el extracto. Las áreas pueden comentar. El kickoff interno y el del cliente son opcionales: una obra en curso se puede migrar directo al cronograma.";
  }
  return enabled
    .map((area) => `· ${area.name}: ${area.description}`)
    .join("\n");
}

export function scheduleUnlocked(project: Project) {
  return project.id !== "prj-pending";
}

export function clientLabel(client: Client | undefined) {
  if (!client) return "Sin cliente";
  return client.rut ? `${client.name} · ${client.rut}` : client.name;
}

export function fitLabel(fit: CommercialFit) {
  return COMMERCIAL_FIT_OPTIONS.find((item) => item.id === fit)?.label ?? "Sin juicio";
}
