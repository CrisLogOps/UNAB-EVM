import type { SetupPhase, TenantUser } from "./types";

export const IDENTITY_STORAGE_KEY = "openevm.identity.v1";
export const ACCOUNT_STORAGE_KEY = "openevm.accounts.v1";
export const PASSWORD_MIN_LENGTH = 6;

export type SsoProvider = "google" | "microsoft" | "email";
export type IdentityPath = "undecided" | "new-org" | "join";

export interface Identity {
  name: string;
  email: string;
  provider: SsoProvider;
  path: IdentityPath;
  signedInAt: string;
}

export const SSO_PROVIDERS: { id: Exclude<SsoProvider, "email">; label: string }[] = [
  { id: "google", label: "Continuar con Google" },
  { id: "microsoft", label: "Continuar con Microsoft" },
];

export interface SsoLabProfile {
  name: string;
  email: string;
}

/** Cuentas de laboratorio: no hay OAuth real. */
export const SSO_LAB_PROFILES: Record<Exclude<SsoProvider, "email">, SsoLabProfile[]> = {
  google: [
    { name: "María González", email: "maria.gonzalez@gmail.com" },
    { name: "Juan Rojas", email: "juan.rojas@gmail.com" },
  ],
  microsoft: [
    { name: "Lucía Méndez", email: "lucia.mendez@outlook.com" },
    { name: "Pedro Silva", email: "pedro.silva@outlook.com" },
  ],
};

export type JoinFailure = "no-identity" | "no-environment" | "setup-open" | "not-invited";

export type JoinResult = { ok: true; userId: string } | { ok: false; code: JoinFailure };

export interface PlatformAccount {
  email: string;
  name: string;
  password: string;
  provider: SsoProvider;
  createdAt: string;
  resetRequestedAt?: string;
}

export type AuthIntent = "login" | "register";

export type SignInResult =
  | { ok: true; next: "path" | "app" | "setup"; intro?: boolean }
  | { ok: false; message: string; code?: "unknown" | "bad-password" | "exists" | "invalid" | "replace-needed" };

export function parseAccounts(raw: unknown): PlatformAccount[] {
  if (!Array.isArray(raw)) return [];
  const parsed: PlatformAccount[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PlatformAccount>;
    const email = normalizeEmail(String(row.email ?? ""));
    const name = String(row.name ?? "").trim();
    if (!email.includes("@") || !name) continue;
    const provider = row.provider;
    parsed.push({
      email,
      name,
      password: String(row.password ?? ""),
      provider: provider === "google" || provider === "microsoft" || provider === "email" ? provider : "email",
      createdAt: String(row.createdAt ?? new Date().toISOString()),
      resetRequestedAt: row.resetRequestedAt ? String(row.resetRequestedAt) : undefined,
    });
  }
  return parsed;
}

export function findAccount(accounts: PlatformAccount[], email: string) {
  const clean = normalizeEmail(email);
  return accounts.find((item) => item.email === clean);
}

export type NewOrgResult =
  | { ok: true; next: "setup" | "app" }
  | { ok: false; needsConfirm: true; tenantName: string }
  | { ok: false; needsConfirm?: false; message?: string };

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function splitPersonName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export function joinPersonName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export type CompanyRegisterResult =
  | { ok: true }
  | { ok: false; code: "exists" | "invalid"; message: string };

export function parseIdentity(raw: unknown): Identity | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<Identity>;
  const email = normalizeEmail(String(item.email ?? ""));
  const name = String(item.name ?? "").trim();
  const provider = item.provider === "google" || item.provider === "microsoft" || item.provider === "email" ? item.provider : "email";
  const path = item.path;
  if (path !== "undecided" && path !== "new-org" && path !== "join") return null;
  if (path === "new-org" && !email) {
    return {
      name,
      email: "",
      provider,
      path,
      signedInAt: String(item.signedInAt ?? new Date().toISOString()),
    };
  }
  if (!email.includes("@") || !name) return null;
  return {
    name,
    email,
    provider,
    path,
    signedInAt: String(item.signedInAt ?? new Date().toISOString()),
  };
}

export function findActiveUserByEmail(users: TenantUser[], email: string) {
  const clean = normalizeEmail(email);
  if (!clean) return undefined;
  return users.find((item) => item.active && normalizeEmail(item.email) === clean);
}

export function resolveJoin(
  users: TenantUser[],
  setupPhase: SetupPhase,
  tenantName: string,
  email: string,
): JoinResult {
  const user = findActiveUserByEmail(users, email);
  if (!tenantName.trim() && setupPhase !== "done") {
    return { ok: false, code: "no-environment" };
  }
  if (setupPhase !== "done") {
    return { ok: false, code: "setup-open" };
  }
  if (!user) return { ok: false, code: "not-invited" };
  return { ok: true, userId: user.id };
}

export const JOIN_ERROR_COPY: Record<JoinFailure, string> = {
  "no-identity": "Primero entra con SSO o con tu correo.",
  "no-environment":
    "En este navegador no hay un ambiente cerrado. Crea una organización nueva o espera a que el representante termine el alta.",
  "setup-open":
    "El representante todavía está en el Setup 0. Cuando cierre el alta podrás entrar con el correo con el que te invitaron.",
  "not-invited":
    "Este correo no está en el equipo. Pide al administrador que te agregue en Personas o en el paso Equipo del alta.",
};
