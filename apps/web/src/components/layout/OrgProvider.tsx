"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PLATFORM_COMPONENTS, defaultComponentIds, navFromComponentIds, type NavItem } from "@/lib/components-catalog";
import { SETUP_STORAGE_KEY, ROLE_LABELS } from "@/lib/constants";
import { PRESET_ROLES, defaultProfileDraft, type CompanySize } from "@/lib/company-presets";
import { companySizeForMode, extraCollaborators, filterNavForMode, isIndividualMode, INDIVIDUAL_HIDDEN_COMPONENT_IDS, type OperatingMode } from "@/lib/operating-mode";
import { DIRECTION_AREA_ID, type AreaDraft } from "@/lib/tenant-setup";
import { normalizeTenantIntegrations } from "@/lib/tenant-integrations";
import { emptyKickoff, emptyProposal, normalizeKickoff, commercialDeliveryReady, partiesValidated, areasUserCanReview, coversKickoffRole, canEditSoldExtract, canEditPmNotes, proposalReady, draftFinalProposal, areaReviewValid, individualInternalReady, composeIndividualJudgment, collaborativeInternalReady } from "@/lib/kickoff";
import {
  extraComponentIdsForRole,
  extraPermissionsForRole,
  ownerBlockedPermissions,
} from "@/lib/coverage";
import { canOperateAs, coveringRoles, handedRoles } from "@/lib/handover";
import { canExecute } from "@/lib/raci";
import { defaultScheduleActivities, isFieldEvidenceActivity, leafDescendants, normalizeGanttActivity, scaleActivitiesToBudget } from "@/lib/schedule-csv";
import { registeredBudgetClp } from "@/lib/evm";
import {
  ACCOUNT_STORAGE_KEY,
  IDENTITY_STORAGE_KEY,
  PASSWORD_MIN_LENGTH,
  findAccount,
  findActiveUserByEmail,
  joinPersonName,
  normalizeEmail,
  parseAccounts,
  parseIdentity,
  resolveJoin,
  type Identity,
  type NewOrgResult,
  type PlatformAccount,
  type CompanyRegisterResult,
  type SignInResult,
  type SsoProvider,
} from "@/lib/identity";
import { fetchMvpSnapshot, mvpApiEnabled, saveMvpSnapshot } from "@/lib/mvp-api";
import {
  backfillProgressIntoWorkBook,
  emptyWorkBookEntry,
  entryFromProgressReport,
  nextFolio,
  normalizeWorkBookEntry,
  normalizeWorkBookMeta,
  workBookEntryReady,
} from "@/lib/work-book";
import { qualityTemplate } from "@/lib/quality";
import type {
  AtomicPermission,
  Client,
  EvidenceStatus,
  GanttActivity,
  KnowledgeEntry,
  KickoffReviewStance,
  OrgArea,
  OrgProfile,
  PlatformComponentId,
  ProgressReport,
  Project,
  QualityCheck,
  QualityGeo,
  QualityItemResult,
  Nonconformity,
  ProjectAssignment,
  ProjectKickoff,
  SetupPhase,
  StaffInvite,
  Tenant,
  TenantUser,
  UserRole,
  WorkBookBoardStatus,
  WorkBookEntry,
  WorkBookKind,
  WorkBookMeta,
  WorkBookSafetyLevel,
  WorkBookThirdPartyKind,
} from "@/lib/types";

import {
  emptyTenant,
  founderDraft,
  initialAreas,
  initialProfiles,
} from "@/mocks/org";

export type { CompanySize };

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  provider: SsoProvider;
}

export interface CompanyPayload {
  company: string;
  rut: string;
}

export interface StructurePayload {
  activityType: string;
  companySize: CompanySize;
  areas: AreaDraft[];
}

export interface OperatingModePayload {
  operatingMode: OperatingMode;
  activityType: string;
}

interface OrgContextValue {
  hydrated: boolean;
  identity: Identity | null;
  setupPhase: SetupPhase;
  ownerManagesAll: boolean;
  isIndividualMode: boolean;
  tenant: Tenant;
  clients: Client[];
  invites: StaffInvite[];
  areas: OrgArea[];
  users: TenantUser[];
  profiles: OrgProfile[];
  assignments: ProjectAssignment[];
  kickoffs: ProjectKickoff[];
  knowledge: KnowledgeEntry[];
  projects: Project[];
  visibleProjects: Project[];
  gantt: GanttActivity[];
  reports: ProgressReport[];
  workBook: WorkBookEntry[];
  workBookMetas: WorkBookMeta[];
  qualityChecks: QualityCheck[];
  nonconformities: Nonconformity[];
  projectId: string;
  project: Project;
  sessionUserId: string;
  sessionUser: TenantUser;
  role: UserRole;
  sessionProfile: OrgProfile | undefined;
  nav: NavItem[];
  setSessionUserId: (id: string) => void;
  setProjectId: (id: string) => void;
  updateTenant: (patch: Partial<Pick<Tenant, "name" | "rut" | "integrations">>) => void;
  applySizePreset: (size: CompanySize) => void;
  addArea: (name: string, role: UserRole, description: string) => void;
  toggleArea: (id: string, enabled: boolean) => void;
  addProfile: (input: Omit<OrgProfile, "id">) => void;
  updateProfileComponents: (id: string, componentIds: PlatformComponentId[]) => void;
  updateProfileTasks: (id: string, extraTaskIds: string[]) => void;
  deleteProfile: (id: string) => boolean;
  addUser: (
    input: Omit<TenantUser, "id" | "active" | "role" | "areaId" | "introSeen"> & {
      profileId: string;
      password: string;
    },
  ) => { ok: true } | { ok: false; message: string };
  removeUser: (userId: string) => boolean;
  hasPasswordLogin: (email: string) => boolean;
  setPersonPassword: (userId: string, password: string) => { ok: boolean; message: string };
  assignProfile: (userId: string, profileId: string) => boolean;
  unassignProfile: (userId: string) => boolean;
  addProject: (
    input: Omit<
      Project,
      | "id"
      | "tenantId"
      | "status"
      | "kickoffPhase"
      | "baselineStatus"
      | "baselineVersion"
      | "bac"
      | "proposedBac"
      | "counterBac"
      | "budgetNote"
      | "scheduleExample"
    >,
  ) => string;
  addClient: (input: { name: string; rut: string; contactName?: string; contactEmail?: string }) => string;
  updateClient: (
    clientId: string,
    input: { name: string; rut: string; contactName?: string; contactEmail?: string },
  ) => void;
  discardIncompleteClient: (clientId: string) => boolean;
  addClientProject: (
    clientId: string,
    input: { name: string; code: string; startDate: string; finishDate: string; proposedBac: number },
  ) => string;
  updateClientProject: (
    projectId: string,
    input: { name: string; code: string; startDate: string; finishDate: string; proposedBac: number },
  ) => boolean;
  saveKickoff: (projectId: string, patch: Partial<ProjectKickoff>) => void;
  stampCommercialKickoff: (projectId: string, patch: Partial<ProjectKickoff>, userId: string) => boolean;
  recordAreaKickoffReview: (
    projectId: string,
    input: {
      areaId: string;
      stance?: KickoffReviewStance;
      comment: string;
      evidenceFileName?: string;
      evidenceFileType?: string;
      evidenceFileSize?: number;
      knowledgeRefs?: string[];
      snapshot?: Partial<ProjectKickoff>;
    },
  ) => boolean;
  confirmInternalKickoff: (projectId: string, patch?: Partial<ProjectKickoff>, userId?: string) => boolean;
  openClientKickoff: (projectId: string, patch?: Partial<ProjectKickoff>, userId?: string) => boolean;
  confirmClientKickoff: (projectId: string, patch?: Partial<ProjectKickoff>) => boolean;
  activateProject: (projectId: string) => boolean;
  clientFor: (clientId: string) => Client | undefined;
  kickoffFor: (projectId: string) => ProjectKickoff | undefined;
  assignUserToProject: (projectId: string, userId: string, note: string) => void;
  removeAssignment: (id: string) => void;
  teamForProject: (projectId: string) => TenantUser[];
  proposeBudget: (id: string, amountClp: number, note: string) => void;
  counterBudget: (id: string, amountClp: number, note: string) => void;
  acceptBudget: (id: string) => void;
  approveBudget: (id: string) => void;
  addGanttActivity: (input: Omit<GanttActivity, "id" | "projectId">) => void;
  updateGanttActivity: (id: string, patch: Partial<Omit<GanttActivity, "id" | "projectId" | "baselineStart" | "baselineFinish">>) => void;
  importSchedule: (rows: Omit<GanttActivity, "id" | "projectId" | "progress">[]) => number;
  addProgressReport: (input: {
    taskId: string;
    physicalPercent: number;
    actualCost: number;
    evidenceName?: string;
    note?: string;
  }) => boolean;
  completeWorkPackage: (activityId: string) => number;
  setWorkBookBoardStatus: (id: string, status: WorkBookBoardStatus) => void;
  addWorkBookEntry: (input: {
    kind: WorkBookKind;
    body: string;
    occurredOn?: string;
    evidenceFileName?: string;
    evidenceFileType?: string;
    evidenceFileSize?: number;
    issuer?: string;
    reference?: string;
    dueOn?: string;
    safetyLevel?: WorkBookSafetyLevel;
    location?: string;
    thirdPartyKind?: WorkBookThirdPartyKind;
    thirdPartyName?: string;
    activityId?: string;
    weather?: string;
    occurredTime?: string;
  }) => boolean;
  saveWorkBookMeta: (projectId: string, patch: Partial<WorkBookMeta>) => void;
  workBookMetaFor: (projectId: string) => WorkBookMeta;
  reviewEvidence: (reportId: string, status: Extract<EvidenceStatus, "validated" | "rejected">) => void;
  applyQualityTemplate: (activityId: string, templateId: string) => boolean;
  recordQualityItem: (
    checkId: string,
    itemId: string,
    result: Exclude<QualityItemResult, "pending">,
    extra: { note?: string; evidenceName?: string; gps?: QualityGeo; dueOn?: string },
  ) => boolean;
  closeNonconformity: (id: string, input: { note: string; evidenceName?: string }) => boolean;
  identifyRepresentative: (payload: RegisterPayload) => CompanyRegisterResult;
  completeRegister: (payload: CompanyPayload) => CompanyRegisterResult;
  beginRegistration: (options?: { replaceExisting?: boolean }) => NewOrgResult;
  completeOperatingMode: (payload: OperatingModePayload) => void;
  completeStructure: (payload: StructurePayload) => void;
  confirmRaci: (manageAll?: boolean) => void;
  switchOperatingMode: (mode: OperatingMode) => void;
  goToSetupPhase: (phase: Exclude<SetupPhase, "done">) => void;
  sendInvite: (name: string, email: string, profileId: string) => boolean;
  finishSetup: () => void;
  resetOnboarding: () => void;
  signInWithSso: (provider: Exclude<SsoProvider, "email">, name: string, email: string) => SignInResult;
  signInWithEmail: (name: string, email: string) => SignInResult;
  loginWithPassword: (email: string, password: string) => SignInResult;
  registerWithPassword: (name: string, email: string, password: string) => SignInResult;
  loginWithSso: (provider: Exclude<SsoProvider, "email">, name: string, email: string) => SignInResult;
  registerWithSso: (provider: Exclude<SsoProvider, "email">, name: string, email: string) => SignInResult;
  requestPasswordReset: (email: string) => { ok: boolean; message: string };
  completePasswordReset: (email: string, password: string) => { ok: boolean; message: string };
  continueAsFounder: () => SignInResult;
  startNewOrganization: (options?: { replaceExisting?: boolean }) => NewOrgResult;
  joinExistingEnvironment: () => ReturnType<typeof resolveJoin>;
  signOut: () => void;
  markIntroSeen: (userId: string) => void;
  setOwnerManagesAll: (value: boolean) => void;
  canOperate: (permission: AtomicPermission) => boolean;
  responsibleFor: (permission: AtomicPermission) => string | undefined;
  handedRoles: UserRole[];
}

const PLACEHOLDER_PROJECT: Project = {
  id: "prj-pending",
  tenantId: "tenant-local",
  clientId: "",
  name: "Primer proyecto",
  code: "P-01",
  bac: 0,
  startDate: "2026-01-06",
  finishDate: "2026-06-30",
  baselineStatus: "DRAFT",
  baselineVersion: null,
  currency: "CLP",
  status: "draft_kickoff",
  kickoffPhase: "none",
  ufClp: 39_450,
  usdClp: 940,
  proposedBac: null,
  counterBac: null,
  budgetNote: "",
  scheduleExample: false,
};

const ALL_COMPONENT_IDS = PLATFORM_COMPONENTS.map((item) => item.id);

const OrgContext = createContext<OrgContextValue | null>(null);

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tenant"
  );
}

function isoDate(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function trainingWindow() {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 6);
  return { startDate: isoDate(start), finishDate: isoDate(end) };
}

function profileFromArea(area: OrgArea): OrgProfile | null {
  if (area.role === "owner") return null;
  const shortName = area.name.replace(/^Área (de )?/i, "").trim();
  return {
    id: `pf-${area.id}`,
    name: shortName || ROLE_LABELS[area.role],
    role: area.role,
    areaId: area.id,
    description: area.description || ROLE_LABELS[area.role],
    componentIds: defaultComponentIds(area.role),
    extraTaskIds: [],
  };
}

function needsAssignableProfiles(profiles: OrgProfile[]) {
  return !profiles.some((item) => item.role !== "owner");
}

function applyCollaborativePack(size: CompanySize, areas: OrgArea[], profiles: OrgProfile[]) {
  const pack: CompanySize = size === "independent" || !size ? "small" : size;
  const enabled = new Set(PRESET_ROLES[pack]);
  const nextAreas = areas.map((area) => ({ ...area, enabled: enabled.has(area.role) }));
  const next = profiles.map(normalizeProfile);
  enabled.forEach((role) => {
    if (next.some((item) => item.role === role)) return;
    const draft = defaultProfileDraft(role, nextAreas);
    if (draft) next.push(draft);
  });
  return { areas: nextAreas, profiles: applyOwnerCoverage(next) };
}

function seedTrainingGantt(
  projectId: string,
  projectCode: string,
  projectName: string,
  start: string,
  end: string,
): GanttActivity[] {
  const stamp = Date.now();
  const parentCode = `${projectCode}.1`;
  return [
    normalizeGanttActivity({
      id: `g-${stamp}`,
      projectId,
      name: projectName,
      start,
      end,
      progress: 0,
      code: parentCode,
      stage: "Capacitación",
      assigneeRole: "pmo",
      budgetPv: 0,
      parentCode: "",
      requiresFieldEvidence: false,
      elementKind: "paquete",
    }),
    normalizeGanttActivity({
      id: `g-${stamp}-1`,
      projectId,
      name: "Evidencia en terreno",
      start,
      end,
      progress: 0,
      code: `${parentCode}.1`,
      stage: "Capacitación",
      assigneeRole: "field",
      budgetPv: 0,
      parentCode,
      requiresFieldEvidence: true,
      elementKind: "inspeccion",
    }),
    normalizeGanttActivity({
      id: `g-${stamp}-1b`,
      projectId,
      name: "Validación de información (escritorio)",
      start,
      end,
      progress: 0,
      code: `${parentCode}.1b`,
      stage: "Capacitación",
      assigneeRole: "finance",
      budgetPv: 0,
      parentCode,
      requiresFieldEvidence: false,
      elementKind: "actividad",
    }),
    normalizeGanttActivity({
      id: `g-${stamp}-2`,
      projectId,
      name: "Inducción completada",
      start,
      end: start,
      progress: 0,
      code: `${parentCode}.2`,
      stage: "Capacitación",
      assigneeRole: "pmo",
      budgetPv: 0,
      parentCode,
      requiresFieldEvidence: false,
      elementKind: "hito",
    }),
  ];
}

function projectsForUser(
  role: UserRole,
  userId: string,
  projects: Project[],
  assignments: ProjectAssignment[],
  ownerManagesAll: boolean,
) {
  if (role === "owner" || ownerManagesAll) return projects;
  const ids = new Set(
    assignments.filter((item) => item.userId === userId).map((item) => item.projectId),
  );
  return projects.filter((item) => ids.has(item.id));
}

function normalizeProfile(item: OrgProfile): OrgProfile {
  return { ...item, extraTaskIds: item.extraTaskIds ?? [] };
}

function applyOwnerCoverage(profiles: OrgProfile[]) {
  return profiles.map((item) =>
    item.role === "owner"
      ? { ...normalizeProfile(item), componentIds: ALL_COMPONENT_IDS }
      : normalizeProfile(item),
  );
}

function normalizeArea(raw: Partial<OrgArea>, fallback?: OrgArea): OrgArea {
  const base = fallback ?? {
    id: raw.id ?? `area-${Date.now()}`,
    name: raw.name ?? "Área",
    role: (raw.role as UserRole) ?? "viewer",
    enabled: false,
    description: "",
    headcount: 1,
  };
  return {
    id: raw.id ?? base.id,
    name: raw.name ?? base.name,
    role: raw.role ?? base.role,
    enabled: raw.enabled ?? base.enabled,
    description: raw.description ?? base.description,
    headcount: typeof raw.headcount === "number" && raw.headcount > 0 ? raw.headcount : (base.headcount || 1),
  };
}

function normalizeTenant(raw: Partial<Tenant> | undefined): Tenant {
  const base = emptyTenant();
  if (!raw) return base;
  return {
    id: raw.id ?? base.id,
    name: raw.name ?? base.name,
    slug: raw.slug ?? base.slug,
    createdAt: raw.createdAt ?? base.createdAt,
    rut: raw.rut ?? "",
    activityType: raw.activityType ?? "",
    companySize: raw.companySize ?? "",
    operatingMode:
      raw.operatingMode === "individual" || raw.operatingMode === "collaborative"
        ? raw.operatingMode
        : raw.companySize === "independent"
          ? "individual"
          : raw.companySize
            ? "collaborative"
            : "",
    integrations: normalizeTenantIntegrations(raw.integrations),
  };
}

function normalizeProject(raw: Partial<Project>, fallback?: Project): Project {
  const status = raw.status ?? fallback?.status ?? "draft_kickoff";
  const clientId = raw.clientId ?? fallback?.clientId ?? "";
  const kickoffPhase =
    raw.kickoffPhase ??
    fallback?.kickoffPhase ??
    (status === "active" || !clientId ? "client_done" : "none");
  return {
    id: raw.id ?? fallback?.id ?? `prj-${Date.now()}`,
    tenantId: raw.tenantId ?? fallback?.tenantId ?? "tenant-local",
    clientId,
    name: raw.name ?? fallback?.name ?? "Proyecto",
    code: raw.code ?? fallback?.code ?? "P-01",
    bac: raw.bac ?? fallback?.bac ?? 0,
    startDate: raw.startDate ?? fallback?.startDate ?? "",
    finishDate: raw.finishDate ?? fallback?.finishDate ?? "",
    baselineStatus: raw.baselineStatus ?? fallback?.baselineStatus ?? "DRAFT",
    baselineVersion: raw.baselineVersion ?? fallback?.baselineVersion ?? null,
    currency: raw.currency ?? fallback?.currency ?? "CLP",
    status,
    kickoffPhase,
    ufClp: raw.ufClp ?? fallback?.ufClp ?? 39_450,
    usdClp: raw.usdClp ?? fallback?.usdClp ?? 940,
    proposedBac: raw.proposedBac ?? fallback?.proposedBac ?? null,
    counterBac: raw.counterBac ?? fallback?.counterBac ?? null,
    budgetNote: raw.budgetNote ?? fallback?.budgetNote ?? "",
    scheduleExample: raw.scheduleExample ?? fallback?.scheduleExample ?? false,
  };
}

function seedMissingExampleSchedules(projects: Project[], gantt: GanttActivity[]) {
  let nextGantt = gantt;
  const nextProjects = projects.map((project) => {
    if (project.id === "prj-pending" || !project.startDate || !project.finishDate) return project;
    const budget = registeredBudgetClp(project);
    const existing = nextGantt.filter((item) => item.projectId === project.id);
    if (!(budget > 0)) {
      if (project.scheduleExample && existing.length) {
        nextGantt = nextGantt.filter((item) => item.projectId !== project.id);
      }
      return existing.length && !project.scheduleExample ? project : { ...project, scheduleExample: false };
    }
    if (existing.length) {
      if (project.scheduleExample) {
        nextGantt = [
          ...nextGantt.filter((item) => item.projectId !== project.id),
          ...scaleActivitiesToBudget(existing, budget),
        ];
      }
      return project;
    }
    nextGantt = [
      ...nextGantt,
      ...defaultScheduleActivities(project.id, project.startDate, project.finishDate, budget),
    ];
    return { ...project, scheduleExample: true };
  });
  return { projects: nextProjects, gantt: nextGantt };
}

function alignExampleSchedule(
  current: GanttActivity[],
  project: Project | undefined,
  amount: number,
): GanttActivity[] {
  if (!project || !(amount > 0) || !project.startDate || !project.finishDate) return current;
  const existing = current.filter((item) => item.projectId === project.id);
  if (existing.length && !project.scheduleExample) return current;
  const next = existing.length
    ? scaleActivitiesToBudget(existing, amount)
    : defaultScheduleActivities(project.id, project.startDate, project.finishDate, amount);
  return [...current.filter((item) => item.projectId !== project.id), ...next];
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [setupPhase, setSetupPhase] = useState<SetupPhase>("register");
  const [tenant, setTenant] = useState<Tenant>(() => emptyTenant());
  const [clients, setClients] = useState<Client[]>([]);
  const [kickoffs, setKickoffs] = useState<ProjectKickoff[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [areas, setAreas] = useState(initialAreas);
  const [profiles, setProfiles] = useState(() => applyOwnerCoverage(initialProfiles));
  const [users, setUsers] = useState<TenantUser[]>([founderDraft]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gantt, setGantt] = useState<GanttActivity[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [workBook, setWorkBook] = useState<WorkBookEntry[]>([]);
  const [workBookMetas, setWorkBookMetas] = useState<WorkBookMeta[]>([]);
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [nonconformities, setNonconformities] = useState<Nonconformity[]>([]);
  const [sessionUserId, setSessionUserIdState] = useState(founderDraft.id);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [projectId, setProjectIdState] = useState("");
  const skipPersist = useRef(true);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessionUser = users.find((item) => item.id === sessionUserId) ?? users[0] ?? founderDraft;
  const role = sessionUser.role;
  const sessionProfile = profiles.find((item) => item.id === sessionUser.profileId);
  const handed = handedRoles(users);
  const extraPermissions = extraPermissionsForRole(role, users, profiles);
  const ownerBlocked = ownerBlockedPermissions(users, profiles);
  const extraNavIds = extraComponentIdsForRole(role, users, profiles);
  const individual = isIndividualMode(tenant);
  const ownerManagesAll = handed.length === 0 || individual;
  const visibleProjects = projectsForUser(
    role,
    sessionUser.id,
    projects,
    assignments,
    role === "owner",
  );
  const project =
    visibleProjects.find((item) => item.id === projectId) ?? visibleProjects[0] ?? PLACEHOLDER_PROJECT;

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const raw = localStorage.getItem(SETUP_STORAGE_KEY);
        const local = raw ? JSON.parse(raw) : null;
        const remote = mvpApiEnabled() ? await fetchMvpSnapshot() : null;
        const snap = local?.setupPhase ? local : remote ?? local;
        if (!cancelled && snap?.setupPhase) {
          setSetupPhase(snap.setupPhase);
          if (snap.tenant) setTenant(normalizeTenant(snap.tenant));
          if (snap.clients) setClients(snap.clients);
          if (snap.kickoffs) {
            setKickoffs(
              snap.kickoffs.map((item: ProjectKickoff) => normalizeKickoff(item, item.projectId, item.clientId)),
            );
          }
          if (snap.knowledge) setKnowledge(snap.knowledge);
          if (snap.invites) {
            setInvites(
              snap.invites.map((item: StaffInvite) => ({
                ...item,
                name: item.name || item.email.split("@")[0] || item.email,
              })),
            );
          }
          if (snap.users?.length) {
            setUsers(
              snap.users.map((item: TenantUser) => ({
                ...item,
                introSeen: item.introSeen ?? item.role === "owner",
              })),
            );
          }
          const loadedProjects = snap.projects
            ? snap.projects.map((item: Project) => normalizeProject(item))
            : [];
          const loadedGantt: GanttActivity[] = snap.gantt
            ? snap.gantt.map((item: GanttActivity) => normalizeGanttActivity(item))
            : [];
          const seeded = seedMissingExampleSchedules(loadedProjects, loadedGantt);
          if (snap.projects) setProjects(seeded.projects);
          if (snap.assignments) setAssignments(snap.assignments);
          if (snap.gantt || seeded.gantt.length) setGantt(seeded.gantt);
          if (snap.reports) setReports(snap.reports);
          const loadedBook = Array.isArray(snap.workBook)
            ? snap.workBook.map((item: WorkBookEntry) => normalizeWorkBookEntry(item))
            : [];
          const loadedReports: ProgressReport[] = snap.reports ?? [];
          setWorkBook([...loadedBook, ...backfillProgressIntoWorkBook(loadedReports, loadedBook, seeded.gantt)]);
          if (Array.isArray(snap.workBookMetas)) {
            setWorkBookMetas(
              snap.workBookMetas.map((item: WorkBookMeta) =>
                normalizeWorkBookMeta(item, item.projectId, item.contractNumber),
              ),
            );
          }
          if (Array.isArray(snap.qualityChecks)) setQualityChecks(snap.qualityChecks);
          if (Array.isArray(snap.nonconformities)) setNonconformities(snap.nonconformities);
          if (snap.profiles?.length) setProfiles(applyOwnerCoverage(snap.profiles));
          if (snap.areas?.length) setAreas(snap.areas.map((item: OrgArea) => normalizeArea(item)));
          if (snap.sessionUserId) setSessionUserIdState(snap.sessionUserId);
          if (snap.projectId) setProjectIdState(snap.projectId);
        }
        try {
          const rawIdentity = localStorage.getItem(IDENTITY_STORAGE_KEY);
          const parsed = parseIdentity(rawIdentity ? JSON.parse(rawIdentity) : null);
          if (parsed) {
            setIdentity(parsed);
            const roster: TenantUser[] = snap?.users?.length ? snap.users : [founderDraft];
            const match = findActiveUserByEmail(roster, parsed.email);
            if (match) setSessionUserIdState(match.id);
          }
        } catch {
          /* identidad local opcional */
        }
        try {
          const rawAccounts = localStorage.getItem(ACCOUNT_STORAGE_KEY);
          setAccounts(parseAccounts(rawAccounts ? JSON.parse(rawAccounts) : []));
        } catch {
          setAccounts([]);
        }
      } catch {
        /* ambiente local: si el snapshot está corrupto se reinicia el alta */
      }
      if (!cancelled) {
        skipPersist.current = false;
        setHydrated(true);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (isIndividualMode(tenant)) return;
    if (!needsAssignableProfiles(profiles)) return;
    const size = tenant.companySize && tenant.companySize !== "independent" ? tenant.companySize : "small";
    const next = applyCollaborativePack(size, areas, profiles);
    if (next.profiles.length <= profiles.length) return;
    setAreas(next.areas);
    setProfiles(next.profiles);
    if (!tenant.companySize || tenant.companySize === "independent") {
      setTenant((current) => ({
        ...current,
        companySize: "small",
        operatingMode: current.operatingMode || "collaborative",
      }));
    }
  }, [hydrated, tenant, profiles, areas]);

  useEffect(() => {
    if (!hydrated || skipPersist.current) return;
    const payload = {
      setupPhase,
      ownerManagesAll,
      tenant,
      clients,
      kickoffs,
      knowledge,
      invites,
      users,
      projects,
      assignments,
      gantt,
      reports,
      workBook,
      workBookMetas,
      qualityChecks,
      nonconformities,
      profiles,
      areas,
      sessionUserId,
      projectId: project.id,
    };
    localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(payload));
    if (!mvpApiEnabled()) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void saveMvpSnapshot(payload);
    }, 800);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [
    hydrated,
    setupPhase,
    ownerManagesAll,
    tenant,
    clients,
    kickoffs,
    knowledge,
    invites,
    users,
    projects,
    assignments,
    gantt,
    reports,
    workBook,
    workBookMetas,
    qualityChecks,
    nonconformities,
    profiles,
    areas,
    sessionUserId,
    project.id,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    if (identity) localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
    else localStorage.removeItem(IDENTITY_STORAGE_KEY);
  }, [hydrated, identity]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
  }, [hydrated, accounts]);

  const navIds = (() => {
    const hidden = new Set(INDIVIDUAL_HIDDEN_COMPONENT_IDS);
    const ids =
      role === "owner"
        ? [...ALL_COMPONENT_IDS]
        : [...new Set([...(sessionProfile?.componentIds ?? defaultComponentIds(role)), ...extraNavIds])];
    if (role !== "owner" && canExecute(role, "evidence:upload")) {
      ids.push("progress");
      ids.push("workbook");
      ids.push("quality");
    }
    if (role !== "owner" && canExecute(role, "evidence:approve") && !ids.includes("quality")) {
      ids.push("quality");
    }
    const ordered = ["dashboard" as const, ...ids.filter((id) => id !== "dashboard")];
    if (!individual) return ordered;
    return ordered.filter((id) => !hidden.has(id));
  })();

  const value = useMemo<OrgContextValue>(
    () => {
      function openSession(name: string, email: string, provider: SsoProvider): SignInResult {
        const cleanName = name.trim();
        const cleanEmail = normalizeEmail(email);
        const user = findActiveUserByEmail(users, cleanEmail);
        if (user && setupPhase === "done") {
          setIdentity({
            name: user.name || cleanName,
            email: cleanEmail,
            provider,
            path: user.role === "owner" ? "new-org" : "join",
            signedInAt: new Date().toISOString(),
          });
          setSessionUserIdState(user.id);
          return { ok: true, next: "app", intro: !user.introSeen };
        }
        if (user && user.role !== "owner") {
          setIdentity({
            name: user.name || cleanName,
            email: cleanEmail,
            provider,
            path: "join",
            signedInAt: new Date().toISOString(),
          });
          return { ok: false, message: "El representante todavía está en el Setup 0. Cuando cierre el alta podrás entrar." };
        }
        const session: Identity = {
          name: cleanName,
          email: cleanEmail,
          provider,
          path: "new-org",
          signedInAt: new Date().toISOString(),
        };
        const started = beginNewOrganization(session, false);
        if (!started.ok) {
          if (started.needsConfirm) {
            setIdentity({ ...session, path: "undecided" });
            return {
              ok: false,
              code: "replace-needed",
              message: `Este navegador ya tiene ${started.tenantName}. Si esta es tu organización nueva, confirmá reemplazar el alta local. Si ya tenés cuenta en ese ambiente, volvé a Iniciar sesión.`,
            };
          }
          return { ok: false, message: started.message ?? "No se pudo iniciar el alta." };
        }
        return { ok: true, next: started.next === "app" ? "app" : "setup" };
      }
      function beginNewOrganization(session: Identity, replaceExisting?: boolean): NewOrgResult {
        const founder = users.find((item) => item.id === founderDraft.id);
        const sameFounder = Boolean(founder?.email) && normalizeEmail(founder?.email ?? "") === session.email;
        const hasEnvironment = Boolean(tenant.name);
        if (hasEnvironment && !sameFounder && !replaceExisting) {
          return { ok: false, needsConfirm: true, tenantName: tenant.name || "el ambiente actual" };
        }
        if (sameFounder && setupPhase === "done") {
          setIdentity({ ...session, path: "new-org" });
          setSessionUserIdState(founderDraft.id);
          return { ok: true, next: "app" };
        }
        if (sameFounder) {
          setUsers((current) =>
            current.map((item) =>
              item.id === founderDraft.id
                ? { ...item, name: session.name, email: session.email, introSeen: true }
                : item,
            ),
          );
          setSessionUserIdState(founderDraft.id);
          setIdentity({ ...session, path: "new-org" });
          return { ok: true, next: "setup" };
        }
        skipPersist.current = true;
        setSetupPhase("register");
        setTenant(emptyTenant());
        setClients([]);
        setKickoffs([]);
        setKnowledge([]);
        setInvites([]);
        setProfiles(applyOwnerCoverage(initialProfiles));
        setAreas(initialAreas);
        setUsers([
          {
            ...founderDraft,
            name: session.name,
            email: session.email,
            introSeen: true,
          },
        ]);
        setAssignments([]);
        setProjects([]);
        setGantt([]);
        setReports([]);
        setWorkBook([]);
        setWorkBookMetas([]);
        setQualityChecks([]);
        setNonconformities([]);
        setSessionUserIdState(founderDraft.id);
        setProjectIdState("");
        localStorage.removeItem(SETUP_STORAGE_KEY);
        setIdentity({ ...session, path: "new-org" });
        skipPersist.current = false;
        return { ok: true, next: "setup" };
      }
      function commitSignIn(provider: SsoProvider, name: string, email: string): SignInResult {
        const cleanName = name.trim();
        const cleanEmail = normalizeEmail(email);
        if (!cleanName || !cleanEmail.includes("@")) {
          return { ok: false, message: "Indica nombre y un correo válido." };
        }
        return openSession(cleanName, cleanEmail, provider);
      }
      return {
      hydrated,
      identity,
      setupPhase,
      ownerManagesAll,
      isIndividualMode: individual,
      tenant,
      clients,
      kickoffs,
      knowledge,
      invites,
      areas,
      users,
      profiles,
      assignments,
      projects,
      visibleProjects,
      gantt,
      reports,
      workBook,
      workBookMetas,
      qualityChecks,
      nonconformities,
      projectId: project.id,
      project,
      sessionUserId: sessionUser.id,
      sessionUser,
      role,
      sessionProfile,
      nav: filterNavForMode(
        role === "owner" || sessionUser.profileId
          ? navFromComponentIds(navIds)
          : [{ href: "/demo", label: "Inicio", group: "hoy" }],
        individual,
      ),
      setSessionUserId(id) {
        const next = users.find((item) => item.id === id);
        if (!next) return;
        setSessionUserIdState(id);
        const nextProjects = projectsForUser(
          next.role,
          next.id,
          projects,
          assignments,
          next.role === "owner",
        );
        if (!nextProjects.some((item) => item.id === projectId) && nextProjects[0]) {
          setProjectIdState(nextProjects[0].id);
        }
      },
      setProjectId: setProjectIdState,
      updateTenant(patch) {
        setTenant((current) =>
          normalizeTenant({
            ...current,
            ...patch,
            integrations: patch.integrations
              ? { ...normalizeTenantIntegrations(patch.integrations), updatedAt: new Date().toISOString() }
              : current.integrations,
          }),
        );
      },
      applySizePreset(size) {
        const enabled = new Set(PRESET_ROLES[size]);
        setAreas((current) => {
          const nextAreas = current.map((area) => ({ ...area, enabled: enabled.has(area.role) }));
          setProfiles((currentProfiles) => {
            const next = currentProfiles.map(normalizeProfile);
            enabled.forEach((role) => {
              if (next.some((item) => item.role === role)) return;
              const draft = defaultProfileDraft(role, nextAreas);
              if (draft) next.push(draft);
            });
            return next;
          });
          return nextAreas;
        });
      },
      addArea(name, role, description) {
        const id = `area-${Date.now()}`;
        setAreas((current) => [
          ...current,
          { id, name, role, enabled: true, description, headcount: 1 },
        ]);
      },
      addProfile(input) {
        setProfiles((current) => [
          ...current,
          { ...input, extraTaskIds: input.extraTaskIds ?? [], id: `pf-${Date.now()}` },
        ]);
      },
      updateProfileComponents(id, componentIds) {
        setProfiles((current) =>
          current.map((item) => (item.id === id ? { ...item, componentIds } : item)),
        );
      },
      updateProfileTasks(id, extraTaskIds) {
        setProfiles((current) =>
          current.map((item) => (item.id === id ? { ...item, extraTaskIds } : item)),
        );
      },
      deleteProfile(id) {
        const target = profiles.find((item) => item.id === id);
        if (!target || target.role === "owner") return false;
        setUsers((current) =>
          current.map((user) =>
            user.profileId === id
              ? { ...user, profileId: "", role: "viewer" as const, areaId: "" }
              : user,
          ),
        );
        setProfiles((current) => current.filter((item) => item.id !== id));
        return true;
      },
      assignProfile(userId, profileId) {
        const user = users.find((item) => item.id === userId);
        const profile = profiles.find((item) => item.id === profileId);
        if (!user || !profile) return false;
        if (profile.role === "owner" && user.role !== "owner") return false;
        if (user.role === "owner" && profile.role !== "owner") return false;
        setUsers((current) =>
          current.map((item) =>
            item.id === userId
              ? { ...item, profileId: profile.id, role: profile.role, areaId: profile.areaId }
              : item,
          ),
        );
        setInvites((current) =>
          current.map((item) =>
            item.email === user.email
              ? { ...item, role: profile.role, profileId: profile.id }
              : item,
          ),
        );
        return true;
      },
      unassignProfile(userId) {
        const user = users.find((item) => item.id === userId);
        if (!user || user.role === "owner") return false;
        setUsers((current) =>
          current.map((item) =>
            item.id === userId ? { ...item, profileId: "", role: "viewer" as const, areaId: "" } : item,
          ),
        );
        return true;
      },
      toggleArea(id, enabled) {
        setAreas((current) => {
          const next = current.map((area) => (area.id === id ? { ...area, enabled } : area));
          if (enabled) {
            const area = next.find((item) => item.id === id);
            if (area && area.role !== "owner") {
              setProfiles((currentProfiles) => {
                if (currentProfiles.some((item) => item.role === area.role)) return currentProfiles;
                const draft = defaultProfileDraft(area.role, next);
                return draft ? [...currentProfiles, draft] : currentProfiles;
              });
            }
          }
          return next;
        });
      },
      addUser(input) {
        const profile = profiles.find((item) => item.id === input.profileId);
        if (!profile || profile.role === "owner") {
          return { ok: false, message: "Elegí un puesto distinto al de administrador." };
        }
        const cleanName = input.name.trim();
        const cleanEmail = normalizeEmail(input.email);
        const password = input.password;
        if (!cleanName || !cleanEmail.includes("@")) {
          return { ok: false, message: "Indica nombre y un correo válido. Ese correo es el usuario de entrada." };
        }
        if (password.length < PASSWORD_MIN_LENGTH) {
          return {
            ok: false,
            message: `La clave debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres, igual que la del administrador.`,
          };
        }
        if (users.some((item) => normalizeEmail(item.email) === cleanEmail)) {
          return {
            ok: false,
            message: "Esa persona ya está en el equipo. Definí o cambiá su clave desde la fila.",
          };
        }
        if (findAccount(accounts, cleanEmail)) {
          return {
            ok: false,
            message: "Ese correo ya tiene una cuenta de entrada. Usalo para iniciar sesión o cambiá la clave desde Personas.",
          };
        }
        const userId = `u-${Date.now()}`;
        setUsers((current) => [
          ...current,
          {
            name: cleanName,
            email: cleanEmail,
            profileId: profile.id,
            id: userId,
            role: profile.role,
            areaId: profile.areaId,
            active: true,
            introSeen: false,
          },
        ]);
        setAccounts((current) => [
          ...current,
          {
            email: cleanEmail,
            name: cleanName,
            password,
            provider: "email",
            createdAt: new Date().toISOString(),
          },
        ]);
        const projectId = project.id !== PLACEHOLDER_PROJECT.id ? project.id : projects[0]?.id;
        if (projectId) {
          setAssignments((current) => [
            ...current,
            {
              id: `as-${Date.now()}`,
              projectId,
              userId,
              note: `${cleanName} · ${profile.name}`,
            },
          ]);
        }
        return { ok: true };
      },
      hasPasswordLogin(email) {
        const account = findAccount(accounts, email);
        return Boolean(account?.password);
      },
      setPersonPassword(userId, password) {
        const user = users.find((item) => item.id === userId);
        if (!user || user.role === "owner") {
          return { ok: false, message: "La clave del administrador se gestiona en el alta o en Olvidé la clave." };
        }
        if (password.length < PASSWORD_MIN_LENGTH) {
          return { ok: false, message: `La clave debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.` };
        }
        const cleanEmail = normalizeEmail(user.email);
        if (!cleanEmail.includes("@")) {
          return { ok: false, message: "Esa persona no tiene un correo válido para entrar." };
        }
        setAccounts((current) => {
          const existing = findAccount(current, cleanEmail);
          if (existing) {
            return current.map((item) =>
              item.email === cleanEmail
                ? { ...item, name: user.name, password, provider: "email", resetRequestedAt: undefined }
                : item,
            );
          }
          return [
            ...current,
            {
              email: cleanEmail,
              name: user.name,
              password,
              provider: "email",
              createdAt: new Date().toISOString(),
            },
          ];
        });
        return { ok: true, message: `${user.name} ya puede entrar y salir con ${cleanEmail} y esa clave.` };
      },
      removeUser(userId) {
        const user = users.find((item) => item.id === userId);
        if (!user || user.role === "owner") return false;
        const cleanEmail = normalizeEmail(user.email);
        setUsers((current) => current.filter((item) => item.id !== userId));
        setAssignments((current) => current.filter((item) => item.userId !== userId));
        setInvites((current) => current.filter((item) => item.email !== user.email));
        setAccounts((current) => current.filter((item) => item.email !== cleanEmail));
        if (sessionUserId === userId) setSessionUserIdState(founderDraft.id);
        return true;
      },
      addProject(input) {
        const id = `prj-${Date.now()}`;
        const clientId = input.clientId ?? "";
        setProjects((current) => [
          ...current,
          {
            ...input,
            clientId,
            id,
            tenantId: tenant.id,
            bac: 0,
            proposedBac: null,
            counterBac: null,
            budgetNote: "",
            status: clientId ? "draft_kickoff" : "awaiting_budget",
            kickoffPhase: clientId ? "none" : "client_done",
            baselineStatus: "DRAFT",
            baselineVersion: null,
            scheduleExample: false,
          },
        ]);
        if (clientId) {
          setKickoffs((current) =>
            current.some((item) => item.projectId === id)
              ? current
              : [...current, emptyKickoff(id, clientId)],
          );
        }
        setAssignments((current) => [
          ...current,
          {
            id: `as-${Date.now()}`,
            projectId: id,
            userId: sessionUser.id,
            note: ownerManagesAll ? "Lo cubre el administrador por ahora" : "Gestor de proyectos",
          },
        ]);
        setProjectIdState(id);
        return id;
      },
      addClient(input) {
        const id = `cli-${Date.now()}`;
        setClients((current) => [
          ...current,
          {
            id,
            tenantId: tenant.id,
            name: input.name.trim(),
            rut: input.rut.trim(),
            contactName: input.contactName?.trim() ?? "",
            contactEmail: input.contactEmail?.trim().toLowerCase() ?? "",
            createdAt: isoDate(new Date()),
          },
        ]);
        return id;
      },
      updateClient(clientId, input) {
        setClients((current) =>
          current.map((item) =>
            item.id === clientId
              ? {
                  ...item,
                  name: input.name.trim(),
                  rut: input.rut.trim(),
                  contactName: input.contactName?.trim() ?? "",
                  contactEmail: input.contactEmail?.trim().toLowerCase() ?? "",
                }
              : item,
          ),
        );
      },
      discardIncompleteClient(clientId) {
        if (projects.some((item) => item.clientId === clientId)) return false;
        setClients((current) => current.filter((item) => item.id !== clientId));
        return true;
      },
      addClientProject(clientId, input) {
        const id = `prj-${Date.now()}`;
        const stamp = Date.now();
        const proposedBac = input.proposedBac > 0 ? input.proposedBac : 0;
        setProjects((current) => [
          ...current,
          {
            id,
            tenantId: tenant.id,
            clientId,
            name: input.name.trim(),
            code: input.code.trim().toUpperCase(),
            bac: 0,
            startDate: input.startDate,
            finishDate: input.finishDate,
            baselineStatus: "DRAFT",
            baselineVersion: null,
            currency: "CLP",
            status: "draft_kickoff",
            kickoffPhase: "none",
            ufClp: 39_450,
            usdClp: 940,
            proposedBac: proposedBac || null,
            counterBac: null,
            budgetNote: proposedBac ? "Presupuesto inicial al crear el proyecto" : "",
            scheduleExample: proposedBac > 0,
          },
        ]);
        if (proposedBac > 0 && input.startDate && input.finishDate) {
          setGantt((current) => [
            ...current.filter((item) => item.projectId !== id),
            ...defaultScheduleActivities(id, input.startDate, input.finishDate, proposedBac),
          ]);
        }
        setKickoffs((current) => [...current, emptyKickoff(id, clientId)]);
        setAssignments((current) => [
          ...current,
          {
            id: `as-${stamp}`,
            projectId: id,
            userId: founderDraft.id,
            note: "Administrador",
          },
          ...users
            .filter((person) => person.active && person.id !== founderDraft.id)
            .map((person, index) => ({
              id: `as-${stamp}-${index}`,
              projectId: id,
              userId: person.id,
              note: `${person.name} · equipo de la empresa`,
            })),
        ]);
        setProjectIdState(id);
        return id;
      },
      updateClientProject(projectId, input) {
        const target = projects.find((item) => item.id === projectId);
        if (!target) return false;
        const proposedBac = input.proposedBac > 0 ? input.proposedBac : 0;
        const nextProject: Project = {
          ...target,
          name: input.name.trim() || target.name,
          code: input.code.trim().toUpperCase() || target.code,
          startDate: input.startDate || target.startDate,
          finishDate: input.finishDate || target.finishDate,
          proposedBac: proposedBac || target.proposedBac,
          budgetNote:
            proposedBac && !target.budgetNote
              ? "Presupuesto inicial al crear el proyecto"
              : target.budgetNote,
        };
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId
              ? {
                  ...nextProject,
                  scheduleExample:
                    proposedBac > 0
                      ? item.scheduleExample || !gantt.some((row) => row.projectId === projectId)
                      : item.scheduleExample,
                }
              : item,
          ),
        );
        if (proposedBac > 0 && nextProject.startDate && nextProject.finishDate) {
          setGantt((current) => alignExampleSchedule(current, { ...nextProject, scheduleExample: true }, proposedBac));
        }
        setProjectIdState(projectId);
        return true;
      },
      saveKickoff(projectId, patch) {
        setKickoffs((current) => {
          const existing = current.find((item) => item.projectId === projectId);
          const project = projects.find((item) => item.id === projectId);
          const clientId = project?.clientId ?? existing?.clientId ?? "";
          const merged = { ...(existing ?? emptyKickoff(projectId, clientId)), ...patch };
          const next = normalizeKickoff(
            {
              ...merged,
              areaReviews: existing?.areaReviews ?? merged.areaReviews,
              proposal: patch.proposal ?? existing?.proposal ?? merged.proposal,
            },
            projectId,
            clientId,
          );
          if (existing) {
            return current.map((item) => (item.projectId === projectId ? next : item));
          }
          return [...current, next];
        });
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId && item.kickoffPhase === "none"
              ? { ...item, kickoffPhase: "internal_pending" }
              : item,
          ),
        );
      },
      stampCommercialKickoff(projectId, patch, userId) {
        if (!canEditSoldExtract(sessionUser, users, ownerManagesAll)) return false;
        const existing = kickoffs.find((item) => item.projectId === projectId);
        const project = projects.find((item) => item.id === projectId);
        const kickoff = normalizeKickoff(
          {
            ...(existing ?? emptyKickoff(projectId, project?.clientId ?? "")),
            ...patch,
            areaReviews: existing?.areaReviews ?? [],
            commercialCommitment:
              patch.commercialCommitment?.trim() ||
              existing?.commercialCommitment?.trim() ||
              patch.proposal?.body?.trim() ||
              existing?.proposal?.body?.trim() ||
              "",
            requirements: patch.requirements?.trim() || existing?.requirements?.trim() || "Según propuesta inicial",
            soldStartDate: patch.soldStartDate || existing?.soldStartDate || project?.startDate || "",
            soldFinishDate: patch.soldFinishDate || existing?.soldFinishDate || project?.finishDate || "",
          },
          projectId,
          project?.clientId ?? "",
        );
        if (!commercialDeliveryReady(kickoff)) return false;
        const next = {
          ...kickoff,
          commercialDeliveredBy: userId,
          commercialDeliveredAt: new Date().toISOString(),
        };
        setKickoffs((current) => {
          if (current.some((item) => item.projectId === projectId)) {
            return current.map((item) => (item.projectId === projectId ? next : item));
          }
          return [...current, next];
        });
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId && item.kickoffPhase !== "internal_done" && item.kickoffPhase !== "client_done"
              ? { ...item, kickoffPhase: individual ? "awaiting_pm" : "awaiting_areas" }
              : item,
          ),
        );
        return true;
      },
      recordAreaKickoffReview(projectId, input) {
        const project = projects.find((item) => item.id === projectId);
        if (!project || !input.comment.trim()) return false;
        const existing = kickoffs.find((item) => item.projectId === projectId);
        const base = normalizeKickoff(
          {
            ...(existing ?? emptyKickoff(projectId, project.clientId)),
            ...input.snapshot,
            areaReviews: existing?.areaReviews ?? input.snapshot?.areaReviews ?? [],
            proposal: input.snapshot?.proposal ?? existing?.proposal,
            commercialCommitment:
              input.snapshot?.commercialCommitment?.trim() ||
              existing?.commercialCommitment?.trim() ||
              input.snapshot?.proposal?.body?.trim() ||
              existing?.proposal?.body?.trim() ||
              "",
            soldStartDate: input.snapshot?.soldStartDate || existing?.soldStartDate || project.startDate,
            soldFinishDate: input.snapshot?.soldFinishDate || existing?.soldFinishDate || project.finishDate,
          },
          projectId,
          project.clientId,
        );
        if (!proposalReady(base.proposal)) return false;
        const area = areas.find((item) => item.id === input.areaId);
        if (!area) return false;
        if (!areasUserCanReview(sessionUser, areas, users, ownerManagesAll).some((item) => item.id === area.id)) {
          return false;
        }
        const now = new Date().toISOString();
        const stamped = base.commercialDeliveredAt
          ? base
          : {
              ...base,
              commercialDeliveredBy: base.commercialDeliveredBy || sessionUser.id,
              commercialDeliveredAt: now,
            };
        const review = {
          id: `rev-${projectId}-${area.id}`,
          areaId: area.id,
          areaName: area.name,
          role: area.role,
          userId: sessionUser.id,
          stance: input.stance || "ok",
          comment: input.comment.trim(),
          evidenceFileName: input.evidenceFileName?.trim() || "",
          evidenceFileType: input.evidenceFileType ?? "",
          evidenceFileSize: input.evidenceFileSize ?? 0,
          knowledgeRefs: input.knowledgeRefs ?? [],
          recordedAt: now,
        };
        if (!areaReviewValid(review)) return false;
        const areaReviews = stamped.areaReviews.some((item) => item.areaId === area.id)
          ? stamped.areaReviews.map((item) => (item.areaId === area.id ? review : item))
          : [...stamped.areaReviews, review];
        const next = { ...stamped, areaReviews };
        setKickoffs((current) => {
          if (current.some((item) => item.projectId === projectId)) {
            return current.map((item) => (item.projectId === projectId ? next : item));
          }
          return [...current, next];
        });
        setProjects((current) =>
          current.map((item) => {
            if (item.id !== projectId || item.kickoffPhase === "internal_done" || item.kickoffPhase === "client_done") {
              return item;
            }
            return { ...item, kickoffPhase: item.kickoffPhase === "internal_pending" ? "awaiting_areas" : item.kickoffPhase };
          }),
        );
        const client = clients.find((item) => item.id === project.clientId);
        const entry: KnowledgeEntry = {
          id: `kb-${projectId}-${area.id}`,
          createdAt: review.recordedAt,
          projectId,
          projectName: project.name,
          clientName: client?.name ?? "",
          activityType: tenant.activityType,
          areaId: area.id,
          areaName: area.name,
          role: area.role,
          stance: review.stance,
          comment: review.comment,
          evidenceFileName: review.evidenceFileName,
          proposalTitle: next.proposal.title || next.proposal.fileName,
        };
        setKnowledge((current) => {
          if (current.some((item) => item.id === entry.id)) {
            return current.map((item) => (item.id === entry.id ? entry : item));
          }
          return [...current, entry];
        });
        return true;
      },
      confirmInternalKickoff(projectId, patch, userId) {
        if (!coversKickoffRole(sessionUser, "pmo", users, ownerManagesAll)) return false;
        const existing = kickoffs.find((item) => item.projectId === projectId);
        const project = projects.find((item) => item.id === projectId);
        const normalized = normalizeKickoff(
          {
            ...(existing ?? emptyKickoff(projectId, project?.clientId ?? "")),
            ...patch,
            areaReviews: existing?.areaReviews ?? [],
            proposal: {
              ...emptyProposal(),
              ...existing?.proposal,
              ...patch?.proposal,
            },
          },
          projectId,
          project?.clientId ?? "",
        );
        if (individual) {
          if (!individualInternalReady(normalized)) return false;
        } else {
          return false;
        }
        const kickoff = normalized.commercialDeliveredAt
          ? normalized
          : {
              ...normalized,
              commercialDeliveredAt: new Date().toISOString(),
              commercialDeliveredBy: userId || sessionUser.id,
            };
        const synthesized =
          kickoff.finalProposalToClient.trim() ||
          (individual
            ? kickoff.proposal.body.trim() || kickoff.commercialCommitment.trim()
            : draftFinalProposal(kickoff));
        const ready = individual
          ? {
              ...kickoff,
              finalProposalToClient: synthesized,
              pmFit: kickoff.pmFit || "within",
              pmJudgment: kickoff.pmJudgment.trim() || composeIndividualJudgment(kickoff),
              plannedStartDate: kickoff.plannedStartDate || project?.startDate || "",
              plannedFinishDate: kickoff.plannedFinishDate || project?.finishDate || "",
            }
          : { ...kickoff, finalProposalToClient: synthesized };
        const validator = userId || ready.pmValidatedBy;
        if (!validator) return false;
        const next = {
          ...ready,
          pmValidatedBy: validator,
          pmValidatedAt: new Date().toISOString(),
          internalConfirmedAt: new Date().toISOString(),
        };
        if (!partiesValidated(next)) return false;
        setKickoffs((current) => {
          if (current.some((item) => item.projectId === projectId)) {
            return current.map((item) => (item.projectId === projectId ? next : item));
          }
          return [...current, next];
        });
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId
              ? {
                  ...item,
                  kickoffPhase: "internal_done",
                  startDate: next.plannedStartDate || item.startDate,
                  finishDate: next.plannedFinishDate || item.finishDate,
                }
              : item,
          ),
        );
        const nextStart = next.plannedStartDate || project?.startDate || "";
        const nextFinish = next.plannedFinishDate || project?.finishDate || "";
        const budget = registeredBudgetClp(project ?? { bac: 0, proposedBac: null, counterBac: null });
        if (project?.scheduleExample && nextStart && nextFinish && budget > 0) {
          setGantt((current) => [
            ...current.filter((item) => item.projectId !== projectId),
            ...defaultScheduleActivities(projectId, nextStart, nextFinish, budget),
          ]);
        }
        return true;
      },
      openClientKickoff(projectId, patch, userId) {
        if (individual) return false;
        if (!canEditSoldExtract(sessionUser, users, ownerManagesAll) && !canEditPmNotes(sessionUser, users, ownerManagesAll)) {
          return false;
        }
        const existing = kickoffs.find((item) => item.projectId === projectId);
        const project = projects.find((item) => item.id === projectId);
        if (!project) return false;
        const kickoff = normalizeKickoff(
          {
            ...(existing ?? emptyKickoff(projectId, project.clientId)),
            ...patch,
            areaReviews: existing?.areaReviews ?? [],
            proposal: {
              ...emptyProposal(),
              ...existing?.proposal,
              ...patch?.proposal,
            },
            commercialCommitment:
              patch?.commercialCommitment?.trim() ||
              existing?.commercialCommitment?.trim() ||
              patch?.proposal?.body?.trim() ||
              existing?.proposal?.body?.trim() ||
              "",
          },
          projectId,
          project.clientId,
        );
        if (!collaborativeInternalReady(kickoff)) return false;
        const now = new Date().toISOString();
        const next = {
          ...kickoff,
          commercialDeliveredBy: kickoff.commercialDeliveredBy || userId || sessionUser.id,
          commercialDeliveredAt: kickoff.commercialDeliveredAt || now,
          finalProposalToClient: kickoff.finalProposalToClient.trim() || draftFinalProposal(kickoff),
          clientDate: kickoff.clientDate || kickoff.clientKickoffDueDate,
        };
        setKickoffs((current) => {
          if (current.some((item) => item.projectId === projectId)) {
            return current.map((item) => (item.projectId === projectId ? next : item));
          }
          return [...current, next];
        });
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId && item.kickoffPhase !== "client_done"
              ? { ...item, kickoffPhase: "internal_done" }
              : item,
          ),
        );
        return true;
      },
      confirmClientKickoff(projectId, patch) {
        const existing = kickoffs.find((item) => item.projectId === projectId);
        const target = projects.find((item) => item.id === projectId);
        if (!target) return false;
        const kickoff = {
          ...(existing ?? emptyKickoff(projectId, target.clientId)),
          ...patch,
        };
        if (!kickoff.clientAgreements?.trim()) return false;
        setKickoffs((current) => {
          const next = { ...kickoff, clientConfirmedAt: new Date().toISOString() };
          if (current.some((item) => item.projectId === projectId)) {
            return current.map((item) => (item.projectId === projectId ? next : item));
          }
          return [...current, next];
        });
        const nextStart = kickoff.plannedStartDate || target.startDate;
        const nextFinish = kickoff.plannedFinishDate || target.finishDate;
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId
              ? {
                  ...item,
                  kickoffPhase: "client_done",
                  status: "active",
                  startDate: nextStart,
                  finishDate: nextFinish,
                }
              : item,
          ),
        );
        const budget = registeredBudgetClp({
          bac: target.bac,
          proposedBac: target.proposedBac,
          counterBac: target.counterBac,
        });
        if (target.scheduleExample && nextStart && nextFinish && budget > 0) {
          setGantt((current) => [
            ...current.filter((item) => item.projectId !== projectId),
            ...defaultScheduleActivities(projectId, nextStart, nextFinish, budget),
          ]);
        }
        setProjectIdState(projectId);
        return true;
      },
      activateProject(projectId) {
        if (!projectId) return false;
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId && item.status === "draft_kickoff"
              ? { ...item, status: "active" }
              : item,
          ),
        );
        setProjectIdState(projectId);
        return true;
      },
      clientFor(clientId) {
        return clients.find((item) => item.id === clientId);
      },
      kickoffFor(projectId) {
        return kickoffs.find((item) => item.projectId === projectId);
      },
      assignUserToProject(projectId, userId, note) {
        setAssignments((current) => {
          if (current.some((item) => item.projectId === projectId && item.userId === userId)) {
            return current;
          }
          return [...current, { id: `as-${Date.now()}`, projectId, userId, note }];
        });
      },
      removeAssignment(id) {
        setAssignments((current) => current.filter((item) => item.id !== id));
      },
      teamForProject(projectId) {
        const ids = new Set(
          assignments.filter((item) => item.projectId === projectId).map((item) => item.userId),
        );
        return users.filter((item) => ids.has(item.id));
      },
      proposeBudget(id, amountClp, note) {
        const target = projects.find((item) => item.id === id);
        setProjects((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  proposedBac: amountClp,
                  budgetNote: note,
                  status: "budget_proposed",
                  scheduleExample: item.scheduleExample || !gantt.some((row) => row.projectId === id),
                }
              : item,
          ),
        );
        setGantt((current) => alignExampleSchedule(current, target, amountClp));
      },
      counterBudget(id, amountClp, note) {
        const target = projects.find((item) => item.id === id);
        setProjects((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  counterBac: amountClp,
                  budgetNote: note,
                  status: "budget_counter",
                  scheduleExample: item.scheduleExample || !gantt.some((row) => row.projectId === id),
                }
              : item,
          ),
        );
        setGantt((current) => alignExampleSchedule(current, target, amountClp));
      },
      acceptBudget(id) {
        setProjects((current) =>
          current.map((item) =>
            item.id === id ? { ...item, status: "pending_approval" } : item,
          ),
        );
      },
      approveBudget(id) {
        const target = projects.find((item) => item.id === id);
        const bac = target ? target.counterBac ?? target.proposedBac ?? 0 : 0;
        setProjects((current) =>
          current.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              bac,
              status: "active",
              baselineStatus: "DRAFT",
              scheduleExample: item.scheduleExample || !gantt.some((row) => row.projectId === id),
            };
          }),
        );
        setGantt((current) => alignExampleSchedule(current, target, bac));
      },
      addGanttActivity(input) {
        setGantt((current) => [
          ...current,
          normalizeGanttActivity({ ...input, id: `g-${Date.now()}`, projectId: project.id }),
        ]);
      },
      updateGanttActivity(id, patch) {
        setGantt((current) =>
          current.map((item) =>
            item.id === id
              ? normalizeGanttActivity({
                  ...item,
                  ...patch,
                  baselineStart: item.baselineStart,
                  baselineFinish: item.baselineFinish,
                })
              : item,
          ),
        );
      },
      importSchedule(rows) {
        const stamp = Date.now();
        const imported = rows.map((row, index) =>
          normalizeGanttActivity({
            ...row,
            id: `g-${stamp}-${index}`,
            projectId: project.id,
            progress: 0,
          }),
        );
        setGantt((current) => [...current.filter((item) => item.projectId !== project.id), ...imported]);
        setProjects((current) =>
          current.map((item) => (item.id === project.id ? { ...item, scheduleExample: false } : item)),
        );
        return imported.length;
      },
      addProgressReport(input) {
        const activity = gantt.find((item) => item.id === input.taskId && item.projectId === project.id);
        if (!activity) return false;
        const projectRows = gantt.filter((item) => item.projectId === project.id);
        const needsFile = isFieldEvidenceActivity(activity, projectRows) && !individual;
        if (needsFile && !input.evidenceName) return false;
        const validated = individual || !isFieldEvidenceActivity(activity, projectRows);
        const report: ProgressReport = {
          id: `pr-${Date.now()}`,
          projectId: project.id,
          taskId: input.taskId,
          reportedBy: sessionUser.id,
          period: new Date().toISOString().slice(0, 10),
          physicalPercent: input.physicalPercent,
          actualCost: input.actualCost,
          evidenceId: input.evidenceName ? `ev-${Date.now()}` : null,
          evidenceName: input.evidenceName || (individual ? "Registro de avance (autocontrol)" : "Registro de avance"),
          evidenceStatus: validated ? "validated" : "uploaded",
          clientEventId: `evt-${Date.now()}`,
          note: input.note,
        };
        setReports((current) => [...current, report]);
        setWorkBook((current) => [
          ...current,
          entryFromProgressReport(report, activity, nextFolio(current, project.id)),
        ]);
        if (validated) {
          setGantt((current) =>
            current.map((item) =>
              item.id === activity.id
                ? { ...item, progress: Math.max(item.progress, Math.round(input.physicalPercent * 100)) }
                : item,
            ),
          );
        }
        return true;
      },
      completeWorkPackage(activityId) {
        const projectRows = gantt.filter((item) => item.projectId === project.id);
        const target = projectRows.find((item) => item.id === activityId);
        if (!target) return 0;
        const pending = leafDescendants(target, projectRows).filter((item) => item.progress < 100);
        if (!pending.length) return 0;
        const stamp = Date.now();
        const added: ProgressReport[] = pending.map((leaf, index) => ({
          id: `pr-${stamp}-${index}`,
          projectId: project.id,
          taskId: leaf.id,
          reportedBy: sessionUser.id,
          period: new Date().toISOString().slice(0, 10),
          physicalPercent: 1,
          actualCost: 0,
          evidenceId: `ev-${stamp}-${index}`,
          evidenceName: `Cierre de paquete ${target.code || target.name}`,
          evidenceStatus: "validated",
          clientEventId: `evt-${stamp}-${index}`,
          note: `Paquete ${target.code || target.name} cerrado en autocontrol.`,
        }));
        const doneIds = new Set(pending.map((item) => item.id));
        setReports((current) => [...current, ...added]);
        setGantt((current) =>
          current.map((item) => (doneIds.has(item.id) ? { ...item, progress: 100 } : item)),
        );
        setWorkBook((current) => {
          const extra: typeof current = [];
          added.forEach((report, index) => {
            extra.push(entryFromProgressReport(report, pending[index], nextFolio([...current, ...extra], project.id)));
          });
          return [...current, ...extra];
        });
        return pending.length;
      },
      setWorkBookBoardStatus(id, status) {
        const entry = workBook.find((item) => item.id === id);
        if (!entry || entry.boardStatus === status) return;
        setWorkBook((current) => current.map((item) => (item.id === id ? { ...item, boardStatus: status } : item)));
        if (!individual || status !== "closed" || !entry.sourceReportId) return;
        const report = reports.find((item) => item.id === entry.sourceReportId);
        if (!report || report.evidenceStatus === "validated") return;
        setReports((current) =>
          current.map((item) => (item.id === report.id ? { ...item, evidenceStatus: "validated" } : item)),
        );
        setGantt((current) =>
          current.map((item) =>
            item.id === report.taskId
              ? { ...item, progress: Math.max(item.progress, Math.round(report.physicalPercent * 100)) }
              : item,
          ),
        );
      },
      addWorkBookEntry(input) {
        const draft = {
          ...emptyWorkBookEntry(project.id, input.kind, 0, sessionUser.id),
          body: input.body,
          occurredOn: input.occurredOn || new Date().toISOString().slice(0, 10),
          evidenceFileName: input.evidenceFileName ?? "",
          evidenceFileType: input.evidenceFileType ?? "",
          evidenceFileSize: input.evidenceFileSize ?? 0,
          issuer: input.issuer ?? "",
          reference: input.reference ?? "",
          dueOn: input.dueOn ?? "",
          safetyLevel: input.safetyLevel ?? "",
          location: input.location ?? "",
          thirdPartyKind: input.thirdPartyKind ?? "",
          thirdPartyName: input.thirdPartyName ?? "",
          activityId: input.activityId ?? "",
          weather: input.weather ?? "",
          occurredTime: input.occurredTime || new Date().toTimeString().slice(0, 5),
          source: "manual" as const,
        };
        if (!workBookEntryReady(draft)) return false;
        setWorkBook((current) => {
          const folio = nextFolio(current, project.id);
          return [
            ...current,
            {
              ...draft,
              folio,
              id: `wb-${Date.now()}-${folio}`,
            },
          ];
        });
        return true;
      },
      saveWorkBookMeta(projectId, patch) {
        setWorkBookMetas((current) => {
          const existing = current.find((item) => item.projectId === projectId);
          const next = normalizeWorkBookMeta({ ...existing, ...patch, projectId }, projectId, patch.contractNumber || existing?.contractNumber);
          if (!existing) return [...current, next];
          return current.map((item) => (item.projectId === projectId ? next : item));
        });
      },
      workBookMetaFor(projectId) {
        const projectRow = projects.find((item) => item.id === projectId);
        const existing = workBookMetas.find((item) => item.projectId === projectId);
        return normalizeWorkBookMeta(existing, projectId, existing?.contractNumber || projectRow?.code || "");
      },
      reviewEvidence(reportId, status) {
        setReports((current) =>
          current.map((item) => {
            if (item.id !== reportId) return item;
            return { ...item, evidenceStatus: status };
          }),
        );
        const report = reports.find((item) => item.id === reportId);
        if (!report || status !== "validated") return;
        setGantt((current) =>
          current.map((item) =>
            item.id === report.taskId
              ? { ...item, progress: Math.max(item.progress, Math.round(report.physicalPercent * 100)) }
              : item,
          ),
        );
      },
      applyQualityTemplate(activityId, templateId) {
        const template = qualityTemplate(templateId);
        const activity = gantt.find((item) => item.id === activityId && item.projectId === project.id);
        if (!template || !activity) return false;
        if (
          qualityChecks.some(
            (item) =>
              item.projectId === project.id && item.activityId === activityId && item.templateId === templateId,
          )
        ) {
          return false;
        }
        const stamp = Date.now();
        const check: QualityCheck = {
          id: `qc-${stamp}`,
          projectId: project.id,
          activityId,
          templateId: template.id,
          templateName: template.name,
          family: template.family,
          updatedAt: new Date().toISOString(),
          items: template.items.map((item, index) => ({
            id: `qi-${stamp}-${index}`,
            templateItemId: item.id,
            text: item.text,
            blocking: item.blocking,
            result: "pending",
            note: "",
            evidenceName: "",
            recordedAt: "",
            recordedBy: "",
          })),
        };
        setQualityChecks((current) => [...current, check]);
        return true;
      },
      recordQualityItem(checkId, itemId, result, extra) {
        const check = qualityChecks.find((item) => item.id === checkId && item.projectId === project.id);
        const source = check?.items.find((item) => item.id === itemId);
        if (!check || !source) return false;
        const now = new Date().toISOString();
        setQualityChecks((current) =>
          current.map((item) => {
            if (item.id !== checkId) return item;
            return {
              ...item,
              updatedAt: now,
              items: item.items.map((row) =>
                row.id === itemId
                  ? {
                      ...row,
                      result,
                      note: extra.note?.trim() ?? row.note,
                      evidenceName: extra.evidenceName?.trim() ?? row.evidenceName,
                      gps: extra.gps ?? row.gps,
                      recordedAt: now,
                      recordedBy: sessionUser.id,
                    }
                  : row,
              ),
            };
          }),
        );
        if (result === "fail" && source.blocking) {
          const detail = extra.note?.trim() || source.text;
          setNonconformities((current) => {
            const open = current.find((item) => item.itemId === itemId && item.status !== "closed");
            if (open) {
              return current.map((item) =>
                item.id === open.id
                  ? {
                      ...item,
                      detail,
                      dueOn: extra.dueOn || item.dueOn,
                      ownerUserId: sessionUser.id,
                      decisions: [
                        ...item.decisions,
                        { at: now, by: sessionUser.id, action: "Se actualizó la observación." },
                      ],
                    }
                  : item,
              );
            }
            const created: Nonconformity = {
              id: `nc-${Date.now()}`,
              projectId: project.id,
              activityId: check.activityId,
              checkId,
              itemId,
              title: source.text,
              detail,
              blocking: true,
              ownerUserId: sessionUser.id,
              dueOn: extra.dueOn || now.slice(0, 10),
              status: "open",
              openedAt: now,
              openedBy: sessionUser.id,
              closedAt: null,
              closeNote: "",
              closeEvidenceName: "",
              decisions: [{ at: now, by: sessionUser.id, action: "Abierta desde la revisión." }],
            };
            return [...current, created];
          });
        }
        return true;
      },
      closeNonconformity(id, input) {
        const note = input.note.trim();
        if (note.length < 8 && !input.evidenceName?.trim()) return false;
        const target = nonconformities.find((item) => item.id === id && item.projectId === project.id);
        if (!target || target.status === "closed") return false;
        const now = new Date().toISOString();
        setNonconformities((current) =>
          current.map((item) =>
            item.id !== id
              ? item
              : {
                  ...item,
                  status: "closed",
                  closedAt: now,
                  closeNote: note,
                  closeEvidenceName: input.evidenceName?.trim() ?? "",
                  decisions: [...item.decisions, { at: now, by: sessionUser.id, action: "Cerrada con respaldo." }],
                },
          ),
        );
        return true;
      },
      signInWithSso(provider, name, email) {
        return commitSignIn(provider, name, email);
      },
      signInWithEmail(name, email) {
        return commitSignIn("email", name, email);
      },
      loginWithPassword(email, password) {
        const cleanEmail = normalizeEmail(email);
        const account = findAccount(accounts, cleanEmail);
        if (!account) {
          return {
            ok: false,
            code: "unknown",
            message: "No hay una cuenta con ese correo. Usá Registrar para crear el perfil e iniciar el proceso.",
          };
        }
        if (!account.password) {
          return {
            ok: false,
            code: "invalid",
            message: `Esta cuenta entra con ${account.provider === "google" ? "Google" : "Microsoft"}. Usá ese botón en Iniciar sesión.`,
          };
        }
        if (account.password !== password) {
          return {
            ok: false,
            code: "bad-password",
            message: "Clave incorrecta. Desde Registrar podés solicitar reiniciar la clave, o volvé a intentarlo aquí.",
          };
        }
        return openSession(account.name, account.email, account.provider);
      },
      registerWithPassword(name, email, password) {
        const cleanName = name.trim();
        const cleanEmail = normalizeEmail(email);
        if (!cleanName || !cleanEmail.includes("@")) {
          return { ok: false, code: "invalid", message: "Indica nombre y un correo válido." };
        }
        if (password.length < PASSWORD_MIN_LENGTH) {
          return {
            ok: false,
            code: "invalid",
            message: `La clave debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
          };
        }
        if (findAccount(accounts, cleanEmail)) {
          return {
            ok: false,
            code: "exists",
            message:
              "Este correo ya tiene una cuenta. Enviá una solicitud para reiniciar la clave, o intentá de nuevo en Iniciar sesión.",
          };
        }
        setAccounts((current) => [
          ...current,
          {
            email: cleanEmail,
            name: cleanName,
            password,
            provider: "email",
            createdAt: new Date().toISOString(),
          },
        ]);
        return openSession(cleanName, cleanEmail, "email");
      },
      loginWithSso(provider, name, email) {
        const cleanEmail = normalizeEmail(email);
        const account = findAccount(accounts, cleanEmail);
        if (!account) {
          return {
            ok: false,
            code: "unknown",
            message: "Esa cuenta SSO no está registrada. Usá Registrar para crear el perfil.",
          };
        }
        return openSession(account.name || name, account.email, provider);
      },
      registerWithSso(provider, name, email) {
        const cleanName = name.trim();
        const cleanEmail = normalizeEmail(email);
        if (!cleanName || !cleanEmail.includes("@")) {
          return { ok: false, code: "invalid", message: "Indica nombre y un correo válido." };
        }
        if (findAccount(accounts, cleanEmail)) {
          return {
            ok: false,
            code: "exists",
            message:
              "Este correo ya tiene una cuenta. Enviá una solicitud para reiniciar la clave, o intentá de nuevo en Iniciar sesión.",
          };
        }
        setAccounts((current) => [
          ...current,
          {
            email: cleanEmail,
            name: cleanName,
            password: "",
            provider,
            createdAt: new Date().toISOString(),
          },
        ]);
        return openSession(cleanName, cleanEmail, provider);
      },
      requestPasswordReset(email) {
        const cleanEmail = normalizeEmail(email);
        const account = findAccount(accounts, cleanEmail);
        if (!account) {
          return { ok: false, message: "No hay una cuenta con ese correo." };
        }
        setAccounts((current) =>
          current.map((item) =>
            item.email === cleanEmail ? { ...item, resetRequestedAt: new Date().toISOString() } : item,
          ),
        );
        return {
          ok: true,
          message: "Solicitud enviada. En este laboratorio podés definir una clave nueva ahora, o volver a Iniciar sesión.",
        };
      },
      completePasswordReset(email, password) {
        const cleanEmail = normalizeEmail(email);
        const account = findAccount(accounts, cleanEmail);
        if (!account) return { ok: false, message: "No hay una cuenta con ese correo." };
        if (!account.resetRequestedAt) {
          return { ok: false, message: "Primero enviá la solicitud para reiniciar la clave." };
        }
        if (password.length < PASSWORD_MIN_LENGTH) {
          return { ok: false, message: `La clave debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.` };
        }
        setAccounts((current) =>
          current.map((item) =>
            item.email === cleanEmail ? { ...item, password, provider: "email", resetRequestedAt: undefined } : item,
          ),
        );
        return { ok: true, message: "Clave actualizada. Volvé a Iniciar sesión." };
      },
      continueAsFounder() {
        const founder = users.find((item) => item.role === "owner" && item.email.includes("@"));
        if (!founder || setupPhase !== "done") {
          return { ok: false, message: "No hay un representante con ambiente cerrado en este navegador." };
        }
        setIdentity({
          name: founder.name || "Representante",
          email: normalizeEmail(founder.email),
          provider: "email",
          path: "new-org",
          signedInAt: new Date().toISOString(),
        });
        setSessionUserIdState(founder.id);
        return { ok: true, next: "app", intro: !founder.introSeen };
      },
      startNewOrganization(options) {
        if (!identity) return { ok: false, message: "Primero iniciá sesión o registrate." };
        return beginNewOrganization(identity, options?.replaceExisting);
      },
      joinExistingEnvironment() {
        if (!identity) return { ok: false, code: "no-identity" as const };
        const result = resolveJoin(users, setupPhase, tenant.name, identity.email);
        if (!result.ok) return result;
        setIdentity({ ...identity, path: "join" });
        setSessionUserIdState(result.userId);
        return result;
      },
      signOut() {
        setIdentity(null);
      },
      beginRegistration(options) {
        const session: Identity = {
          name: "",
          email: "",
          provider: "email",
          path: "new-org",
          signedInAt: new Date().toISOString(),
        };
        return beginNewOrganization(session, options?.replaceExisting);
      },
      identifyRepresentative(payload) {
        const founderName = joinPersonName(payload.firstName, payload.lastName) || payload.name.trim();
        const founderEmail = normalizeEmail(payload.email);
        const provider = payload.provider === "google" || payload.provider === "microsoft" ? payload.provider : "email";
        if (!founderName || !founderEmail.includes("@")) {
          return { ok: false, code: "invalid", message: "Completá nombre, apellido y un correo válido." };
        }
        if (provider === "email") {
          if (payload.password.length < PASSWORD_MIN_LENGTH) {
            return {
              ok: false,
              code: "invalid",
              message: `La clave de inicio de sesión debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
            };
          }
          if (payload.password !== payload.passwordConfirm) {
            return { ok: false, code: "invalid", message: "La clave y su confirmación no coinciden." };
          }
        }
        if (findAccount(accounts, founderEmail)) {
          return {
            ok: false,
            code: "exists",
            message:
              "Este correo ya tiene una cuenta. Iniciá sesión o solicitá reiniciar la clave desde la pantalla de entrada.",
          };
        }
        setAccounts((current) => [
          ...current,
          {
            email: founderEmail,
            name: founderName,
            password: provider === "email" ? payload.password : "",
            provider,
            createdAt: new Date().toISOString(),
          },
        ]);
        setIdentity({
          name: founderName,
          email: founderEmail,
          provider,
          path: "new-org",
          signedInAt: new Date().toISOString(),
        });
        setUsers((current) => {
          const founder = current.find((item) => item.id === founderDraft.id) ?? founderDraft;
          const rest = current.filter((item) => item.id !== founderDraft.id);
          return [{ ...founder, name: founderName, email: founderEmail, introSeen: true }, ...rest];
        });
        setSessionUserIdState(founderDraft.id);
        return { ok: true };
      },
      completeRegister(payload) {
        const founderName = identity?.name.trim() || sessionUser.name.trim();
        const founderEmail = normalizeEmail(identity?.email || "");
        if (!founderName || !founderEmail.includes("@")) {
          return {
            ok: false,
            code: "invalid",
            message: "Primero identificá al representante con correo o con Google / Microsoft.",
          };
        }
        const company = payload.company.trim();
        if (!company || !payload.rut.trim()) {
          return { ok: false, code: "invalid", message: "Completá razón social y RUT." };
        }
        const nextTenant: Tenant = {
          ...tenant,
          id: "tenant-local",
          name: company,
          slug: slugify(company),
          createdAt: tenant.createdAt || isoDate(new Date()),
          rut: payload.rut.trim(),
        };
        setTenant(nextTenant);
        setUsers((current) => {
          const founder = current.find((item) => item.id === founderDraft.id) ?? founderDraft;
          const rest = current.filter((item) => item.id !== founderDraft.id);
          return [{ ...founder, name: founderName, email: founderEmail, introSeen: true }, ...rest];
        });
        setSessionUserIdState(founderDraft.id);
        setSetupPhase("mode");
        return { ok: true };
      },
      completeOperatingMode(payload) {
        if (payload.operatingMode === "collaborative") {
          setTenant((current) => ({
            ...current,
            operatingMode: "collaborative",
            activityType: payload.activityType.trim() || current.activityType,
            companySize: current.companySize === "independent" ? "" : current.companySize,
          }));
          setSetupPhase("structure");
          return;
        }
        const activity = payload.activityType.trim();
        setTenant((current) => ({
          ...current,
          activityType: activity,
          companySize: "independent",
          operatingMode: "individual",
        }));
        const nextAreas = initialAreas.map((area) => ({
          ...area,
          enabled: area.id === DIRECTION_AREA_ID,
          headcount: area.id === DIRECTION_AREA_ID ? 1 : area.headcount,
        }));
        const ownerProfile =
          profiles.find((item) => item.role === "owner") ?? applyOwnerCoverage(initialProfiles)[0];
        setAreas(nextAreas);
        setProfiles(applyOwnerCoverage([ownerProfile]));
        setUsers((current) => {
          const founder = current.find((item) => item.id === founderDraft.id) ?? founderDraft;
          return [{ ...founder, areaId: DIRECTION_AREA_ID, profileId: ownerProfile.id, introSeen: true }];
        });
        setInvites([]);
        setSessionUserIdState(founderDraft.id);
        setSetupPhase("done");
      },
      switchOperatingMode(mode) {
        if (mode === "individual") {
          if (extraCollaborators(users).length > 0) return;
          setTenant((current) => ({
            ...current,
            operatingMode: "individual",
            companySize: "independent",
          }));
          setSessionUserIdState(founderDraft.id);
          return;
        }
        const size = companySizeForMode("collaborative", tenant.companySize) || "small";
        setTenant((current) => ({
          ...current,
          operatingMode: "collaborative",
          companySize: size,
        }));
        if (needsAssignableProfiles(profiles)) {
          const next = applyCollaborativePack(size, areas, profiles);
          setAreas(next.areas);
          setProfiles(next.profiles);
        }
      },
      completeStructure(payload) {
        const founderEmail = (users.find((item) => item.id === founderDraft.id)?.email ?? "").toLowerCase();
        setTenant((current) => ({
          ...current,
          activityType: payload.activityType.trim(),
          companySize: payload.companySize,
          operatingMode: payload.companySize === "independent" ? "individual" : "collaborative",
        }));

        const selected = payload.areas;
        const nextAreas: OrgArea[] = initialAreas.map((area) => {
          if (area.id === DIRECTION_AREA_ID) {
            return { ...area, enabled: true, headcount: 1 };
          }
          const draft = selected.find((item) => item.id === area.id);
          if (!draft) return { ...area, enabled: false };
          return {
            ...area,
            name: draft.name.trim() || area.name,
            role: draft.role,
            description: draft.description || area.description,
            headcount: Math.max(1, draft.headcount),
            enabled: true,
          };
        });
        selected
          .filter((draft) => draft.custom || !initialAreas.some((area) => area.id === draft.id))
          .forEach((draft) => {
            if (nextAreas.some((area) => area.id === draft.id)) return;
            nextAreas.push({
              id: draft.id,
              name: draft.name.trim(),
              role: draft.role,
              enabled: true,
              description: draft.description || "Área personalizada",
              headcount: Math.max(1, draft.headcount),
            });
          });

        const ownerProfile =
          profiles.find((item) => item.role === "owner") ?? applyOwnerCoverage(initialProfiles)[0];
        const nextProfiles = applyOwnerCoverage([
          ownerProfile,
          ...nextAreas
            .filter((area) => area.enabled)
            .map(profileFromArea)
            .filter((item): item is OrgProfile => Boolean(item)),
        ]);

        const stamp = Date.now();
        const contactUsers: TenantUser[] = [];
        const contactInvites: StaffInvite[] = [];
        selected.forEach((draft, index) => {
          const name = draft.contactName.trim();
          const email = draft.contactEmail.trim().toLowerCase();
          if (!name || !email || email === founderEmail) return;
          const area = nextAreas.find((item) => item.id === draft.id);
          const profile = nextProfiles.find((item) => item.areaId === draft.id);
          if (!area || !profile) return;
          const userId = `u-${stamp}-${index}`;
          contactUsers.push({
            id: userId,
            name,
            email,
            role: profile.role,
            areaId: area.id,
            profileId: profile.id,
            active: true,
            introSeen: false,
          });
          contactInvites.push({
            id: `inv-${stamp}-${index}`,
            name,
            email,
            role: profile.role,
            profileId: profile.id,
            sentAt: new Date().toISOString(),
          });
        });

        setAreas(nextAreas);
        setProfiles(nextProfiles);
        setUsers((current) => {
          const founder = current.find((item) => item.id === founderDraft.id) ?? founderDraft;
          return [{ ...founder, areaId: DIRECTION_AREA_ID, profileId: ownerProfile.id, introSeen: true }, ...contactUsers];
        });
        setInvites(contactInvites);
        setSessionUserIdState(founderDraft.id);
        setSetupPhase(payload.companySize === "independent" ? "done" : "raci");
      },
      confirmRaci() {
        setProfiles((current) => applyOwnerCoverage(current));
        setSetupPhase("invites");
      },
      goToSetupPhase(phase) {
        if (phase === "register") {
          setSetupPhase(phase);
          return;
        }
        if ((phase === "mode" || phase === "structure") && tenant.name) {
          setSetupPhase(phase);
          return;
        }
        if ((phase === "raci" || phase === "invites") && tenant.companySize && tenant.operatingMode !== "individual") {
          setSetupPhase(phase);
        }
      },
      sendInvite(name, email, profileId) {
        const cleanName = name.trim();
        const clean = email.trim().toLowerCase();
        if (!cleanName || !clean || !clean.includes("@")) return false;
        const profile = profiles.find((item) => item.id === profileId);
        if (!profile || profile.role === "owner") return false;
        if (users.some((item) => item.email === clean)) return false;
        const userId = `u-${Date.now()}`;
        setUsers((current) => [
          ...current,
          {
            id: userId,
            name: cleanName,
            email: clean,
            role: profile.role,
            areaId: profile.areaId,
            profileId: profile.id,
            active: true,
            introSeen: false,
          },
        ]);
        const firstProject = projects[0];
        if (firstProject) {
          setAssignments((current) => [
            ...current,
            {
              id: `as-${Date.now()}`,
              projectId: firstProject.id,
              userId,
              note: `${cleanName} · ${profile.name}`,
            },
          ]);
        }
        setInvites((current) => [
          ...current,
          {
            id: `inv-${Date.now()}`,
            name: cleanName,
            email: clean,
            role: profile.role,
            profileId: profile.id,
            sentAt: new Date().toISOString(),
          },
        ]);
        return true;
      },
      finishSetup() {
        setSetupPhase("done");
      },
      resetOnboarding() {
        skipPersist.current = true;
        setSetupPhase("register");
        setTenant(emptyTenant());
        setClients([]);
        setKickoffs([]);
        setKnowledge([]);
        setInvites([]);
        setProfiles(applyOwnerCoverage(initialProfiles));
        setAreas(initialAreas);
        setUsers([
          {
            ...founderDraft,
            name: identity?.name ?? "",
            email: identity?.email ?? "",
            introSeen: true,
          },
        ]);
        if (identity) setIdentity({ ...identity, path: "new-org" });
        setAssignments([]);
        setProjects([]);
        setGantt([]);
        setReports([]);
        setWorkBook([]);
        setWorkBookMetas([]);
        setQualityChecks([]);
        setNonconformities([]);
        setSessionUserIdState(founderDraft.id);
        setProjectIdState("");
        localStorage.removeItem(SETUP_STORAGE_KEY);
        skipPersist.current = false;
      },
      markIntroSeen(userId) {
        setUsers((current) =>
          current.map((item) => (item.id === userId ? { ...item, introSeen: true } : item)),
        );
      },
      setOwnerManagesAll() {
        setProfiles((current) => applyOwnerCoverage(current));
      },
      canOperate(permission) {
        return canOperateAs(role, permission, handed, extraPermissions, ownerBlocked);
      },
      responsibleFor(permission) {
        const covering = coveringRoles(permission);
        const byRole = users.find(
          (item) => item.active && item.profileId && covering.includes(item.role),
        );
        if (byRole) return byRole.name;
        const byCoverage = users.find((item) => {
          if (!item.active || !item.profileId || item.role === "owner") return false;
          return extraPermissionsForRole(item.role, users, profiles).includes(permission);
        });
        return byCoverage?.name;
      },
      handedRoles: handed,
    };
    },
    [
      hydrated,
      identity,
      setupPhase,
      ownerManagesAll,
      tenant,
      clients,
      kickoffs,
      knowledge,
      invites,
      areas,
      users,
      profiles,
      assignments,
      projects,
      visibleProjects,
      gantt,
      reports,
      workBook,
      workBookMetas,
      qualityChecks,
      nonconformities,
      project,
      sessionUser,
      role,
      sessionProfile,
      projectId,
      navIds,
      handed,
      extraPermissions,
      ownerBlocked,
      individual,
      accounts,
    ],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg debe usarse dentro de OrgProvider");
  return ctx;
}
