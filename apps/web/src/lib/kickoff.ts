import type {
  Client,
  CommercialFit,
  KickoffPhase,
  KickoffProposal,
  KickoffAreaReview,
  KickoffReviewStance,
  KnowledgeEntry,
  OrgArea,
  Project,
  ProjectKickoff,
  ProjectStatus,
  TenantUser,
} from "./types";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft_kickoff: "Kickoff",
  awaiting_budget: "Espera Finanzas",
  budget_proposed: "Propuesto por Finanzas",
  budget_counter: "Contrapropuesta",
  pending_approval: "Espera visto bueno",
  active: "Activo",
  closed: "Cerrado",
};

export const KICKOFF_PHASE_LABEL: Record<KickoffPhase, string> = {
  none: "Sin kickoff",
  internal_pending: "Comercial entrega la propuesta",
  awaiting_areas: "Áreas validan",
  awaiting_pm: "Gestor cierra",
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

export const MIN_AREA_JUSTIFICATION = 60;

export type KickoffVerdict = "incomplete" | "nogo" | "conditional" | "go";

export const VERDICT_LABEL: Record<KickoffVerdict, string> = {
  incomplete: "Validación incompleta",
  nogo: "No se puede pasar al cliente",
  conditional: "Pase condicionado a ajustes",
  go: "Criterio crítico aprobado",
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
    internalDate: "",
    internalNotes: "",
    pmFit: "",
    pmJudgment: "",
    pmFulfillmentPlan: "",
    pmValidatedBy: "",
    pmValidatedAt: null,
    internalConfirmedAt: null,
    clientDate: "",
    clientAttendees: "",
    clientAgreements: "",
    clientConfirmedAt: null,
  };
}

export function normalizeKickoff(raw: Partial<ProjectKickoff> | undefined, projectId: string, clientId: string): ProjectKickoff {
  const base = {
    ...emptyKickoff(projectId, clientId),
    ...raw,
    projectId: raw?.projectId ?? projectId,
    clientId: raw?.clientId ?? clientId,
    teamValidatedUserIds: raw?.teamValidatedUserIds ?? [],
    commercialDeliveredAt: raw?.commercialDeliveredAt ?? null,
    proposal: {
      ...emptyProposal(),
      ...(raw?.proposal ?? {}),
    },
    areaReviews: (raw?.areaReviews ?? []).map(normalizeAreaReview),
    finalProposalToClient: raw?.finalProposalToClient ?? "",
    pmValidatedAt: raw?.pmValidatedAt ?? null,
    internalConfirmedAt: raw?.internalConfirmedAt ?? null,
    clientConfirmedAt: raw?.clientConfirmedAt ?? null,
    pmFit: raw?.pmFit ?? "",
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
  const sold = Boolean(kickoff.commercialCommitment?.trim() || kickoff.proposal?.body?.trim());
  const dates = Boolean(kickoff.soldStartDate && kickoff.soldFinishDate);
  return proposalReady(kickoff.proposal) && sold && dates;
}

export function involvedAreas(areas: OrgArea[]) {
  const enabled = areas.filter((item) => item.enabled);
  return enabled.length ? enabled : areas.slice(0, 1);
}

export function areaReviewFor(kickoff: ProjectKickoff, areaId: string) {
  return kickoff.areaReviews.find((item) => item.areaId === areaId);
}

export function areaReviewValid(review: KickoffAreaReview | undefined) {
  if (!review?.stance || !review.comment?.trim()) return false;
  return review.comment.trim().length >= MIN_AREA_JUSTIFICATION;
}

export function pendingAreas(kickoff: ProjectKickoff, areas: OrgArea[]) {
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

export function evaluateInternalGate(kickoff: ProjectKickoff, areas: OrgArea[]): InternalKickoffGate {
  const pending = pendingAreas(kickoff, areas);
  const blockers = blockingAreas(kickoff, areas);
  const conditions = adjustingAreas(kickoff, areas);
  const reasons: string[] = [];
  let verdict: KickoffVerdict = "go";

  if (pending.length) {
    verdict = "incomplete";
    reasons.push(
      `Cada área involucrada debe dejar por escrito por qué se justifica (o no) desarrollar la obra (mínimo ${MIN_AREA_JUSTIFICATION} caracteres). El documento de respaldo es opcional. Pendientes: ${pending.map((item) => item.name).join(", ")}.`,
    );
  } else if (blockers.length) {
    verdict = "nogo";
    reasons.push(
      `${blockers.map((item) => item.name).join(", ")} marcó la obra como no viable. Hay que resolver esa observación crítica antes del kickoff con el cliente.`,
    );
  } else if (conditions.length) {
    verdict = "conditional";
    reasons.push(
      `Hay condiciones de ${conditions.map((item) => item.name).join(", ")}. El gestor debe incorporarlas en el plan de cumplimiento.`,
    );
    if (!kickoff.pmFulfillmentPlan?.trim()) {
      reasons.push("Falta el plan de cumplimiento del gestor para esos ajustes.");
    }
  }

  if (!proposalReady(kickoff.proposal)) {
    verdict = "incomplete";
    reasons.unshift("Falta el extracto de lo vendido para que las áreas evalúen la misma propuesta.");
  }

  const partiesOk = partiesValidated(kickoff);
  const pmOk = pmReviewReady(kickoff);
  const canCloseInternal =
    (verdict === "go" || (verdict === "conditional" && Boolean(kickoff.pmFulfillmentPlan?.trim()))) &&
    verdict !== "incomplete" &&
    verdict !== "nogo";
  const canMeetClient = canCloseInternal && partiesOk && pmOk;

  return { verdict, pending, blockers, conditions, reasons, canCloseInternal, canMeetClient };
}

export function areasUserCanReview(
  user: TenantUser,
  areas: OrgArea[],
  ownerManagesAll: boolean,
) {
  const involved = involvedAreas(areas);
  if (ownerManagesAll || user.role === "owner" || user.role === "pmo") return involved;
  return involved.filter((area) => area.id === user.areaId || area.role === user.role);
}

export function composeAreaComments(reviews: KickoffAreaReview[]) {
  if (!reviews.length) return "";
  return reviews
    .map((item) => {
      const stance = REVIEW_STANCE_OPTIONS.find((entry) => entry.id === item.stance)?.label ?? item.stance;
      const evidence = item.evidenceFileName ? ` [evidencia: ${item.evidenceFileName}]` : "";
      return `· ${item.areaName} (${stance}): ${item.comment}${evidence}`;
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
  return [kickoff.commercialCommitment.trim(), comments ? `Criterio de las áreas:\n${comments}` : ""]
    .filter(Boolean)
    .join("\n\n");
}

export function partiesValidated(kickoff: ProjectKickoff) {
  return Boolean(kickoff.commercialDeliveredAt && kickoff.pmValidatedAt);
}

export function internalReadyForClient(kickoff: ProjectKickoff, areas: OrgArea[]) {
  return evaluateInternalGate(kickoff, areas).canMeetClient;
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
    return "Comercial entrega la propuesta. Cada área involucrada deja por escrito las razones que justifican el proyecto. Un documento de respaldo es opcional. Con esos comentarios el gestor cierra el kickoff interno y recién ahí se abre el kickoff con el cliente.";
  }
  return enabled
    .map((area) => `· ${area.name}: ${area.description}`)
    .join("\n");
}

export function scheduleUnlocked(project: Project) {
  return project.kickoffPhase === "client_done";
}

export function clientLabel(client: Client | undefined) {
  if (!client) return "Sin cliente";
  return client.rut ? `${client.name} · ${client.rut}` : client.name;
}

export function fitLabel(fit: CommercialFit) {
  return COMMERCIAL_FIT_OPTIONS.find((item) => item.id === fit)?.label ?? "Sin juicio";
}
