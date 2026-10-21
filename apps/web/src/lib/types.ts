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
  | "quality"
  | "costs"
  | "knowledge"
  | "workbook";

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
export type OperatingMode = "individual" | "collaborative";

export type SetupPhase = "register" | "mode" | "structure" | "raci" | "invites" | "done";

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

/** Cómo se compone el % de una actividad. */
export type ActivityNature = "archivo" | "registro" | "version";

/** Tramo que suma al avance: documento, medición o versión. */
export interface ActivityPiece {
  id: string;
  title: string;
  detail: string;
  weight: number;
}

export type ProgressClosure = "parcial" | "conforme" | "prerequisito" | "no_conforme";

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
  /** En qué consiste el trabajo. */
  scopeNote: string;
  /** Qué tiene que existir para darla por terminada. */
  doneWhen: string;
  nature: ActivityNature;
  pieces: ActivityPiece[];
}

export type SignatureProviderId = "" | "ecert" | "acepta" | "toc" | "firmagob" | "other";
export type ErpPlatformId = "" | "softland" | "defontana" | "nubox" | "manager" | "sap" | "bsale" | "other";
export type SiiInvoiceMode = "" | "honorarios" | "factura_electronica" | "ambos";

/** Antecedentes de firma electrónica avanzada (FEA). La conexión real va en una versión posterior. */
export interface ElectronicSignatureAntecedent {
  hasCertificate: boolean;
  provider: SignatureProviderId;
  providerOther: string;
  holder: string;
  expiresOn: string;
  usedFor: string;
}

/** Antecedentes de SII. No se guarda clave tributaria; solo si existe y cómo se usaría. */
export interface SiiAntecedent {
  hasSiiAccess: boolean;
  invoiceMode: SiiInvoiceMode;
  office: string;
  notes: string;
}

/** ERP u otra plataforma de la organización que ya publique al SII. */
export interface ErpAntecedent {
  hasErp: boolean;
  platform: ErpPlatformId;
  platformOther: string;
  postsToSii: boolean;
  modules: string;
}

export interface TenantIntegrations {
  signature: ElectronicSignatureAntecedent;
  sii: SiiAntecedent;
  erp: ErpAntecedent;
  updatedAt: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  rut: string;
  activityType: string;
  companySize: CompanySize | "";
  operatingMode: OperatingMode | "";
  integrations: TenantIntegrations;
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

export type KickoffAntecedentKind = "partida" | "consideracion";

/** Partida o consideración que acompaña al documento del proyecto. */
export interface KickoffAntecedentItem {
  id: string;
  kind: KickoffAntecedentKind;
  title: string;
  detail: string;
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

export type KnowledgeScope = "empresa" | "cliente" | "proyecto";
export type KnowledgeMoment = "antes" | "durante" | "cierre";
export type KnowledgeSource = "kickoff" | "paquete" | "manual" | "presupuesto";

export type BudgetEventKind = "inicial" | "carga" | "contrapropuesta" | "aceptacion" | "aprobacion";

/** Cada cifra del presupuesto, desde lo vendido hasta el visto bueno. */
export interface BudgetEvent {
  id: string;
  projectId: string;
  at: string;
  kind: BudgetEventKind;
  amountClp: number;
  note: string;
  evidenceFileName: string;
  byUserId: string;
  byRole: UserRole;
  byName: string;
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
  /** Vacío en registros viejos de kickoff: se leen como proyecto, antes de empezar. */
  scope?: KnowledgeScope;
  moment?: KnowledgeMoment;
  source?: KnowledgeSource;
  clientId?: string;
  activityCode?: string;
  activityName?: string;
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
  /** Respuestas del criterio PMBOK (modo individual). Clave = id de pregunta. */
  internalEvalAnswers: Record<string, string>;
  /** Fecha de la consulta interna a las áreas. */
  internalDate: string;
  /** Plazo para el kickoff con el cliente, fijado en la consulta. */
  clientKickoffDueDate: string;
  internalNotes: string;
  pmFit: CommercialFit;
  pmJudgment: string;
  pmFulfillmentPlan: string;
  pmValidatedBy: string;
  pmValidatedAt: string | null;
  internalConfirmedAt: string | null;
  /** Partidas y consideraciones cargadas con el documento del proyecto. */
  antecedentItems: KickoffAntecedentItem[];
  /** Quien formaliza el kickoff interno con los antecedentes. */
  internalSignerName: string;
  internalSignedAt: string | null;
  /** Archivo de cronograma subido como línea base. Vacío si sigue el ejemplo. */
  baselineScheduleName: string;
  clientDate: string;
  clientAttendees: string;
  clientAgreements: string;
  clientConfirmedAt: string | null;
  /** null hasta que la reunión responde. */
  paymentsAgreed: boolean | null;
  /** Qué se dijo de los plazos. */
  paymentNote: string;
  /** Fechas de estado de pago conversadas. Vacío si no se fijaron. */
  paymentDates: string[];
}

export interface PaymentCut {
  id: string;
  projectId: string;
  dueDate: string;
  label: string;
  origin: "kickoff" | "admin";
  note: string;
  /** Lectura congelada. Null mientras el estado sigue abierto. */
  frozenAt: string | null;
  pv: number | null;
  ev: number | null;
  ac: number | null;
  physicalPercent: number | null;
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
  /** Archivo con el que el gestor funda una contrapropuesta. */
  counterEvidenceName?: string;
  /** Cronograma cargado desde la plantilla EDT; hay que editarlo y volver a subirlo. */
  scheduleExample: boolean;
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

export type WorkBookKind = "ito" | "progress" | "safety" | "third_party";
export type WorkBookSource = "manual" | "progress";
export type WorkBookSafetyLevel = "" | "observation" | "incident" | "accident";
export type WorkBookThirdPartyKind = "" | "claim" | "interference";
/** Autocontrol de faena (modo individual). No es firma legal del folio. */
export type WorkBookBoardStatus = "open" | "doing" | "closed";

export type MinuteOrigin = "mandante" | "arquitecto" | "interno";
export type MinuteCostEffect = "gasto" | "adicional" | "sin_costo";

/** Instrucción de la constructora. El gasto entra al costo real; el adicional queda por cobrar. */
export interface SiteMinute {
  id: string;
  projectId: string;
  occurredOn: string;
  origin: MinuteOrigin;
  issuer: string;
  body: string;
  activityId: string;
  costEffect: MinuteCostEffect;
  amountClp: number;
  evidenceFileName: string;
  recordedBy: string;
  recordedAt: string;
}

/** Carátula del libro: datos mínimos para una copia de fiscalización. */
export interface WorkBookMeta {
  projectId: string;
  location: string;
  contractNumber: string;
  itoName: string;
  contractorRep: string;
}

/** Expediente contractual de faena (libro de obra). */
export interface WorkBookEntry {
  id: string;
  projectId: string;
  folio: number;
  kind: WorkBookKind;
  occurredOn: string;
  occurredTime: string;
  recordedAt: string;
  recordedBy: string;
  body: string;
  evidenceFileName: string;
  evidenceFileType: string;
  evidenceFileSize: number;
  source: WorkBookSource;
  sourceReportId: string;
  issuer: string;
  reference: string;
  dueOn: string;
  safetyLevel: WorkBookSafetyLevel;
  location: string;
  weather: string;
  thirdPartyKind: WorkBookThirdPartyKind;
  thirdPartyName: string;
  activityId: string;
  boardStatus: WorkBookBoardStatus;
}

export type QualityFamily = "calidad" | "seguridad";
export type QualityItemResult = "pending" | "ok" | "na" | "fail";
export type NonconformityStatus = "open" | "doing" | "closed";

export interface QualityTemplateItem {
  id: string;
  text: string;
  blocking: boolean;
}

export interface QualityTemplate {
  id: string;
  family: QualityFamily;
  name: string;
  hint: string;
  items: QualityTemplateItem[];
}

export interface QualityGeo {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface QualityCheckItem {
  id: string;
  templateItemId: string;
  text: string;
  blocking: boolean;
  result: QualityItemResult;
  note: string;
  evidenceName: string;
  gps?: QualityGeo;
  recordedAt: string;
  recordedBy: string;
}

export interface QualityCheck {
  id: string;
  projectId: string;
  activityId: string;
  templateId: string;
  templateName: string;
  family: QualityFamily;
  items: QualityCheckItem[];
  updatedAt: string;
}

export interface QualityDecision {
  at: string;
  by: string;
  action: string;
}

export interface Nonconformity {
  id: string;
  projectId: string;
  activityId: string;
  checkId: string;
  itemId: string;
  title: string;
  detail: string;
  blocking: boolean;
  ownerUserId: string;
  dueOn: string;
  status: NonconformityStatus;
  openedAt: string;
  openedBy: string;
  closedAt: string | null;
  closeNote: string;
  closeEvidenceName: string;
  decisions: QualityDecision[];
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
  closure?: ProgressClosure;
  /** Tramos que este registro suma al %. */
  pieceIds?: string[];
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
