export type UserRole =
  | "owner"
  | "pmo"
  | "admin_obra"
  | "finance"
  | "warehouse"
  | "field"
  | "subcontractor"
  | "oficina_tecnica"
  | "commercial"
  | "viewer";

export type RaciMark = "R" | "A" | "C" | "I" | "R/A" | "I/A";

export type AtomicPermission =
  | "project:manager"
  | "project:staff"
  | "schedule:edit"
  | "schedule:view"
  | "evidence:upload"
  | "evidence:approve"
  | "cost:edit"
  | "cost:approve"
  | "cost:view"
  | "inventory:request"
  | "inventory:dispatch"
  | "user:manager"
  | "tenant:settings"
  | "budget:propose"
  | "budget:counter"
  | "budget:approve";

export type PlatformComponentId =
  | "dashboard"
  | "admin"
  | "users"
  | "profiles"
  | "areas"
  | "tenant"
  | "project_staff"
  | "clients"
  | "projects"
  | "gantt"
  | "budget_propose"
  | "budget_counter"
  | "budget_approve"
  | "finance_ep"
  | "cuts"
  | "evidence"
  | "progress"
  | "costs"
  | "knowledge";

export type ComponentMode = "view" | "execute" | "approve";

export type ProjectStatus =
  | "draft_kickoff"
  | "awaiting_budget"
  | "budget_proposed"
  | "budget_counter"
  | "pending_approval"
  | "active"
  | "closed";

export type KickoffPhase = "none" | "internal_pending" | "awaiting_areas" | "awaiting_pm" | "internal_done" | "client_done";

export type CommercialFit = "" | "within" | "adjust" | "gap";
export type KickoffReviewStance = "ok" | "adjust" | "block";

export type AlertStatus = "green" | "yellow" | "red";
export type EvidenceStatus = "missing" | "uploaded" | "validated" | "rejected";
export type BaselineStatus = "DRAFT" | "FROZEN";
export type CompanySize = "independent" | "small" | "medium" | "large";

export type SetupPhase = "register" | "structure" | "raci" | "invites" | "done";

export interface StaffInvite {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileId: string;
  sentAt: string;
}

export interface OrgArea {
  id: string;
  name: string;
  role: UserRole;
  enabled: boolean;
  description: string;
  headcount: number;
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  areaId: string;
  profileId: string;
  active: boolean;
  introSeen: boolean;
}

export interface OrgProfile {
  id: string;
  name: string;
  role: UserRole;
  areaId: string;
  description: string;
  componentIds: PlatformComponentId[];
  extraTaskIds: string[];
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  userId: string;
  note: string;
}

export type ScheduleElementKind = "paquete" | "actividad" | "hito" | "inspeccion";

export interface GanttActivity {
  id: string;
  projectId: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  code: string;
  stage: string;
  assigneeRole: UserRole | "";
  budgetPv: number;
  parentCode: string;
  elementKind: ScheduleElementKind;
  requiresFieldEvidence: boolean;
  baselineStart: string;
  baselineFinish: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  rut: string;
  activityType: string;
  companySize: CompanySize | "";
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  rut: string;
  contactName: string;
  contactEmail: string;
  createdAt: string;
}

export interface KickoffProposal {
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string | null;
  body: string;
}

export interface KickoffAreaReview {
  id: string;
  areaId: string;
  areaName: string;
  role: UserRole;
  userId: string;
  stance: KickoffReviewStance;
  comment: string;
  evidenceFileName: string;
  evidenceFileType: string;
  evidenceFileSize: number;
  knowledgeRefs: string[];
  recordedAt: string;
}

export interface KnowledgeEntry {
  id: string;
  createdAt: string;
  projectId: string;
  projectName: string;
  clientName: string;
  activityType: string;
  areaId: string;
  areaName: string;
  role: UserRole;
  stance: KickoffReviewStance;
  comment: string;
  evidenceFileName: string;
  proposalTitle: string;
}

export interface ProjectKickoff {
  id: string;
  projectId: string;
  clientId: string;
  commercialCommitment: string;
  commercialConditions: string;
  exclusions: string;
  requirements: string;
  soldStartDate: string;
  soldFinishDate: string;
  commercialDeliveredBy: string;
  commercialDeliveredAt: string | null;
  proposal: KickoffProposal;
  areaReviews: KickoffAreaReview[];
  finalProposalToClient: string;
  plannedStartDate: string;
  plannedFinishDate: string;
  siteStartDate: string;
  legalAspects: string;
  contractType: string;
  guarantees: string;
  permits: string;
  workingAgreement: string;
  teamValidatedUserIds: string[];
  internalDate: string;
  internalNotes: string;
  pmFit: CommercialFit;
  pmJudgment: string;
  pmFulfillmentPlan: string;
  pmValidatedBy: string;
  pmValidatedAt: string | null;
  internalConfirmedAt: string | null;
  clientDate: string;
  clientAttendees: string;
  clientAgreements: string;
  clientConfirmedAt: string | null;
}

export interface Project {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  code: string;
  bac: number;
  startDate: string;
  finishDate: string;
  baselineStatus: BaselineStatus;
  baselineVersion: string | null;
  currency: "CLP" | "UF" | "USD";
  status: ProjectStatus;
  kickoffPhase: KickoffPhase;
  ufClp: number;
  usdClp: number;
  proposedBac: number | null;
  counterBac: number | null;
  budgetNote: string;
}

export interface Task {
  id: string;
  projectId: string;
  activityCode: string;
  name: string;
  plannedStart: string;
  plannedFinish: string;
  budgetPv: number;
  weight: number;
  unit?: string;
  qty?: number;
}

export interface ProgressReport {
  id: string;
  projectId: string;
  taskId: string;
  reportedBy: string;
  period: string;
  physicalPercent: number;
  actualCost: number;
  evidenceId: string | null;
  evidenceName: string | null;
  evidenceStatus: EvidenceStatus;
  gps?: { lat: number; lng: number; accuracy: number };
  clientEventId: string;
  note?: string;
}

export interface EvmMetrics {
  projectId: string;
  period: string;
  at: number;
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cpi: number;
  spi: number;
  cv: number;
  sv: number;
  es: number;
  svt: number;
  spit: number;
  eac: number;
  vac: number;
  tcpi: number;
  evidenceLocked: boolean;
  alerts: {
    cpi: AlertStatus;
    spit: AlertStatus;
    tcpi: AlertStatus;
    overall: AlertStatus;
  };
}

export interface SCurvePoint {
  period: string;
  at: number;
  pv: number;
  ev: number;
  ac: number;
}
