"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PLATFORM_COMPONENTS, defaultComponentIds, navFromComponentIds, type NavItem } from "@/lib/components-catalog";
import { SETUP_STORAGE_KEY, ROLE_LABELS } from "@/lib/constants";
import { PRESET_ROLES, defaultProfileDraft, type CompanySize } from "@/lib/company-presets";
import { DIRECTION_AREA_ID, type AreaDraft } from "@/lib/tenant-setup";
import { emptyKickoff, emptyProposal, normalizeKickoff, commercialDeliveryReady, pmReviewReady, partiesValidated, areaReviewsComplete, areasUserCanReview, proposalReady, draftFinalProposal, areaReviewValid, evaluateInternalGate } from "@/lib/kickoff";
import {
  extraComponentIdsForRole,
  extraPermissionsForRole,
  ownerBlockedPermissions,
} from "@/lib/coverage";
import { canOperateAs, coveringRoles, handedRoles } from "@/lib/handover";
import { canExecute } from "@/lib/raci";
import { normalizeGanttActivity } from "@/lib/schedule-csv";
import { fetchMvpSnapshot, mvpApiEnabled, saveMvpSnapshot } from "@/lib/mvp-api";
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
  ProjectAssignment,
  ProjectKickoff,
  SetupPhase,
  StaffInvite,
  Tenant,
  TenantUser,
  UserRole,
} from "@/lib/types";
import {
  emptyTenant,
  founderDraft,
  initialAreas,
  initialProfiles,
} from "@/mocks/org";

export type { CompanySize };

export interface RegisterPayload {
  name: string;
  email: string;
  company: string;
  rut: string;
}

export interface StructurePayload {
  activityType: string;
  companySize: CompanySize;
  areas: AreaDraft[];
}

interface OrgContextValue {
  hydrated: boolean;
  setupPhase: SetupPhase;
  ownerManagesAll: boolean;
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
  projectId: string;
  project: Project;
  sessionUserId: string;
  sessionUser: TenantUser;
  role: UserRole;
  sessionProfile: OrgProfile | undefined;
  nav: NavItem[];
  setSessionUserId: (id: string) => void;
  setProjectId: (id: string) => void;
  applySizePreset: (size: CompanySize) => void;
  addArea: (name: string, role: UserRole, description: string) => void;
  toggleArea: (id: string, enabled: boolean) => void;
  addProfile: (input: Omit<OrgProfile, "id">) => void;
  updateProfileComponents: (id: string, componentIds: PlatformComponentId[]) => void;
  updateProfileTasks: (id: string, extraTaskIds: string[]) => void;
  deleteProfile: (id: string) => boolean;
  addUser: (input: Omit<TenantUser, "id" | "active" | "role" | "areaId" | "introSeen"> & { profileId: string }) => void;
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
    >,
  ) => string;
  addClient: (input: { name: string; rut: string; contactName?: string; contactEmail?: string }) => string;
  addClientProject: (
    clientId: string,
    input: { name: string; code: string; startDate: string; finishDate: string },
  ) => string;
  saveKickoff: (projectId: string, patch: Partial<ProjectKickoff>) => void;
  stampCommercialKickoff: (projectId: string, patch: Partial<ProjectKickoff>, userId: string) => boolean;
  recordAreaKickoffReview: (
    projectId: string,
    input: {
      areaId: string;
      stance: KickoffReviewStance;
      comment: string;
      evidenceFileName?: string;
      evidenceFileType?: string;
      evidenceFileSize?: number;
      knowledgeRefs?: string[];
      snapshot?: Partial<ProjectKickoff>;
    },
  ) => boolean;
  confirmInternalKickoff: (projectId: string, patch?: Partial<ProjectKickoff>, userId?: string) => boolean;
  confirmClientKickoff: (projectId: string, patch?: Partial<ProjectKickoff>) => boolean;
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
    evidenceName: string;
    note?: string;
  }) => boolean;
  reviewEvidence: (reportId: string, status: Extract<EvidenceStatus, "validated" | "rejected">) => void;
  completeRegister: (payload: RegisterPayload) => void;
  completeStructure: (payload: StructurePayload) => void;
  confirmRaci: (manageAll?: boolean) => void;
  goToSetupPhase: (phase: Exclude<SetupPhase, "done">) => void;
  sendInvite: (name: string, email: string, profileId: string) => boolean;
  finishSetup: () => void;
  resetOnboarding: () => void;
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
  };
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
  const [sessionUserId, setSessionUserIdState] = useState(founderDraft.id);
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
  const ownerManagesAll = handed.length === 0;
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
          if (snap.projects) setProjects(snap.projects.map((item: Project) => normalizeProject(item)));
          if (snap.assignments) setAssignments(snap.assignments);
          if (snap.gantt) setGantt(snap.gantt.map((item: GanttActivity) => normalizeGanttActivity(item)));
          if (snap.reports) setReports(snap.reports);
          if (snap.profiles?.length) setProfiles(applyOwnerCoverage(snap.profiles));
          if (snap.areas?.length) setAreas(snap.areas.map((item: OrgArea) => normalizeArea(item)));
          if (snap.sessionUserId) setSessionUserIdState(snap.sessionUserId);
          if (snap.projectId) setProjectIdState(snap.projectId);
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
    profiles,
    areas,
    sessionUserId,
    project.id,
  ]);

  const navIds = (() => {
    const ids =
      role === "owner"
        ? [...ALL_COMPONENT_IDS]
        : [...new Set([...(sessionProfile?.componentIds ?? defaultComponentIds(role)), ...extraNavIds])];
    if (role !== "owner" && canExecute(role, "evidence:upload")) ids.push("progress");
    return ["dashboard" as const, ...ids.filter((id) => id !== "dashboard")];
  })();

  const value = useMemo<OrgContextValue>(
    () => ({
      hydrated,
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
      projectId: project.id,
      project,
      sessionUserId: sessionUser.id,
      sessionUser,
      role,
      sessionProfile,
      nav:
        role === "owner" || sessionUser.profileId
          ? navFromComponentIds(navIds)
          : [{ href: "/demo", label: "Inicio", group: "hoy" }],
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
        setAreas((current) => current.map((area) => (area.id === id ? { ...area, enabled } : area)));
      },
      addUser(input) {
        const profile = profiles.find((item) => item.id === input.profileId);
        if (!profile || profile.role === "owner") return;
        setUsers((current) => [
          ...current,
          {
            ...input,
            id: `u-${Date.now()}`,
            role: profile.role,
            areaId: profile.areaId,
            active: true,
            introSeen: false,
          },
        ]);
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
      addClientProject(clientId, input) {
        const id = `prj-${Date.now()}`;
        const stamp = Date.now();
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
            proposedBac: null,
            counterBac: null,
            budgetNote: "",
          },
        ]);
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
              ? { ...item, kickoffPhase: "awaiting_areas" }
              : item,
          ),
        );
        return true;
      },
      recordAreaKickoffReview(projectId, input) {
        const project = projects.find((item) => item.id === projectId);
        if (!project || !input.comment.trim() || !input.stance) return false;
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
        if (!areasUserCanReview(sessionUser, areas, ownerManagesAll).some((item) => item.id === area.id)) {
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
          stance: input.stance,
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
            const phase = areaReviewsComplete(next, areas) ? "awaiting_pm" : "awaiting_areas";
            return { ...item, kickoffPhase: phase };
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
          stance: input.stance,
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
        if (!areaReviewsComplete(normalized, areas)) return false;
        const gate = evaluateInternalGate({ ...normalized, areaReviews: normalized.areaReviews }, areas);
        if (!gate.canCloseInternal) return false;
        const kickoff = normalized.commercialDeliveredAt
          ? normalized
          : {
              ...normalized,
              commercialDeliveredAt: new Date().toISOString(),
              commercialDeliveredBy: userId || sessionUser.id,
            };
        const synthesized = kickoff.finalProposalToClient.trim() || draftFinalProposal(kickoff);
        const ready = { ...kickoff, finalProposalToClient: synthesized };
        if (!pmReviewReady(ready)) return false;
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
        return true;
      },
      confirmClientKickoff(projectId, patch) {
        const existing = kickoffs.find((item) => item.projectId === projectId);
        const target = projects.find((item) => item.id === projectId);
        if (!target) return false;
        const phase = target.kickoffPhase;
        if (phase !== "internal_done" && phase !== "client_done") return false;
        const kickoff = {
          ...(existing ?? emptyKickoff(projectId, target.clientId)),
          ...patch,
        };
        if (!evaluateInternalGate(kickoff, areas).canMeetClient) return false;
        if (!kickoff.clientAgreements?.trim()) return false;
        setKickoffs((current) => {
          const next = { ...kickoff, clientConfirmedAt: new Date().toISOString() };
          if (current.some((item) => item.projectId === projectId)) {
            return current.map((item) => (item.projectId === projectId ? next : item));
          }
          return [...current, next];
        });
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId
              ? { ...item, kickoffPhase: "client_done", status: "active" }
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
        setProjects((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  proposedBac: amountClp,
                  budgetNote: note,
                  status: "budget_proposed",
                }
              : item,
          ),
        );
      },
      counterBudget(id, amountClp, note) {
        setProjects((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  counterBac: amountClp,
                  budgetNote: note,
                  status: "budget_counter",
                }
              : item,
          ),
        );
      },
      acceptBudget(id) {
        setProjects((current) =>
          current.map((item) =>
            item.id === id ? { ...item, status: "pending_approval" } : item,
          ),
        );
      },
      approveBudget(id) {
        setProjects((current) =>
          current.map((item) => {
            if (item.id !== id) return item;
            const bac = item.counterBac ?? item.proposedBac ?? 0;
            return { ...item, bac, status: "active", baselineStatus: "DRAFT" };
          }),
        );
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
        return imported.length;
      },
      addProgressReport(input) {
        const activity = gantt.find((item) => item.id === input.taskId && item.projectId === project.id);
        if (!activity || !input.evidenceName) return false;
        const report: ProgressReport = {
          id: `pr-${Date.now()}`,
          projectId: project.id,
          taskId: input.taskId,
          reportedBy: sessionUser.id,
          period: new Date().toISOString().slice(0, 10),
          physicalPercent: input.physicalPercent,
          actualCost: input.actualCost,
          evidenceId: `ev-${Date.now()}`,
          evidenceName: input.evidenceName,
          evidenceStatus: "uploaded",
          clientEventId: `evt-${Date.now()}`,
          note: input.note,
        };
        setReports((current) => [...current, report]);
        return true;
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
      completeRegister(payload) {
        const company = payload.company.trim();
        const nextTenant: Tenant = {
          ...tenant,
          id: "tenant-local",
          name: company,
          slug: slugify(company),
          createdAt: tenant.createdAt || isoDate(new Date()),
          rut: payload.rut.trim(),
        };
        const founderName = payload.name.trim();
        const founderEmail = payload.email.trim().toLowerCase();
        setTenant(nextTenant);
        setUsers((current) => {
          const founder = current.find((item) => item.id === founderDraft.id) ?? founderDraft;
          const rest = current.filter((item) => item.id !== founderDraft.id);
          return [{ ...founder, name: founderName, email: founderEmail, introSeen: true }, ...rest];
        });
        setSessionUserIdState(founderDraft.id);
        setSetupPhase("structure");
      },
      completeStructure(payload) {
        const founderEmail = (users.find((item) => item.id === founderDraft.id)?.email ?? "").toLowerCase();
        setTenant((current) => ({
          ...current,
          activityType: payload.activityType.trim(),
          companySize: payload.companySize,
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
        setSetupPhase("raci");
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
        if (phase === "structure" && tenant.name) {
          setSetupPhase(phase);
          return;
        }
        if ((phase === "raci" || phase === "invites") && tenant.companySize) {
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
        setUsers([{ ...founderDraft }]);
        setAssignments([]);
        setProjects([]);
        setGantt([]);
        setReports([]);
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
    }),
    [
      hydrated,
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
      project,
      sessionUser,
      role,
      sessionProfile,
      projectId,
      navIds,
      handed,
      extraPermissions,
      ownerBlocked,
    ],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg debe usarse dentro de OrgProvider");
  return ctx;
}
