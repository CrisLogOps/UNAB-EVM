"use client";

import { useRouter } from "next/navigation";
import { useOrg } from "@/components/layout/OrgProvider";
import { OpenEvmMark } from "@/components/brand/OpenEvmMark";
import { HandoverConfirm } from "@/components/auth/HandoverConfirm";
import { SsoLabPicker } from "@/components/auth/SsoLabPicker";
import { TenantStructureStep } from "@/components/onboarding/TenantStructureStep";
import { OperatingModeStep } from "@/components/onboarding/OperatingModeStep";
import { SETUP_RESET_QUERY } from "@/lib/constants";
import { PASSWORD_MIN_LENGTH, splitPersonName, type SsoProvider } from "@/lib/identity";
import { activityTypeLabel } from "@/lib/tenant-setup";
import { PRESET_LABEL } from "@/lib/company-presets";
import { isFirstOfRole } from "@/lib/handover";
import { resolveOperatingMode } from "@/lib/operating-mode";
import { useState } from "react";
import type { OrgArea, OrgProfile, TenantUser } from "@/lib/types";
import type { CompanyPayload, RegisterPayload } from "@/components/layout/OrgProvider";

const COLLAB_STEPS = [
  { id: "register" as const, label: "Empresa" },
  { id: "mode" as const, label: "Modo" },
  { id: "structure" as const, label: "Áreas" },
  { id: "raci" as const, label: "Perfiles" },
  { id: "invites" as const, label: "Equipo" },
];

const INDIVIDUAL_STEPS = [
  { id: "register" as const, label: "Empresa" },
  { id: "mode" as const, label: "Modo" },
];

export function SetupWizard() {
  const {
    setupPhase,
    identifyRepresentative,
    completeRegister,
    completeOperatingMode,
    completeStructure,
    confirmRaci,
    goToSetupPhase,
    sendInvite,
    finishSetup,
    resetOnboarding,
    assignProfile,
    tenant,
    invites,
    users,
    profiles,
    areas,
    sessionUser,
    identity,
    signOut,
  } = useOrg();
  const router = useRouter();
  const [registerNotice, setRegisterNotice] = useState<string | null>(null);
  const identified = Boolean(identity?.email?.includes("@"));
  const operatingMode = resolveOperatingMode(tenant);
  const STEPS = operatingMode === "collaborative" || setupPhase === "structure" || setupPhase === "raci" || setupPhase === "invites"
    ? COLLAB_STEPS
    : INDIVIDUAL_STEPS;

  const stepIndex = STEPS.findIndex((item) => item.id === setupPhase);
  const assignableProfiles = profiles.filter((item) => item.role !== "owner");
  const registered = Boolean(tenant.name);
  const structured = Boolean(tenant.companySize);

  function closeAndEnter() {
    finishSetup();
    router.push("/demo");
  }

  function canGoTo(index: number) {
    const id = STEPS[index].id;
    if (id === "register") return registered;
    if (id === "mode") return registered;
    if (id === "structure") return registered && operatingMode === "collaborative";
    if (id === "raci" || id === "invites") return structured && operatingMode !== "individual";
    return false;
  }

  return (
    <div className="min-h-screen bg-[var(--brand)] text-white">
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-3 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex items-start justify-between gap-3">
          <OpenEvmMark variant="light" />
          <div className="flex flex-col items-end gap-1">
            {identity ? (
              <p className="max-w-[12rem] truncate text-right text-[11px] text-white/75">
                {identity.name} · {identity.email}
              </p>
            ) : null}
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-md border border-white/25 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10 sm:text-xs"
                onClick={() => {
                  signOut();
                  router.replace("/login");
                }}
              >
                Salir
              </button>
              <button
                type="button"
                className="rounded-md border border-white/25 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10 sm:text-xs"
                onClick={() => {
                  if (window.confirm("Se borra el alta de este navegador y vuelves al paso 1.")) {
                    resetOnboarding();
                    router.replace(`/setup?${SETUP_RESET_QUERY}=1`);
                  }
                }}
              >
                Empezar de cero
              </button>
            </div>
          </div>
        </header>

        <ol className={`mb-6 grid gap-1 text-[11px] sm:gap-2 sm:text-xs ${STEPS.length === 2 ? "grid-cols-2" : "grid-cols-5"}`}>
          {STEPS.map((step, index) => {
            const active = setupPhase === step.id;
            const done = stepIndex > index;
            const canGo = done && canGoTo(index);
            return (
              <li key={step.id}>
                <button
                  type="button"
                  disabled={!canGo}
                  onClick={() => goToSetupPhase(step.id)}
                  className={`w-full rounded-lg px-2 py-2 text-left sm:px-3 ${
                    active
                      ? "bg-[var(--accent)] font-semibold text-[var(--brand-dark)]"
                      : done
                        ? "bg-white/15 hover:bg-white/25"
                        : "bg-white/5 text-white/60"
                  } disabled:cursor-default`}
                >
                  <span className="sm:hidden">{index + 1}</span>
                  <span className="hidden sm:inline">
                    {index + 1}. {step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="flex-1 rounded-2xl bg-white p-4 text-[var(--foreground)] shadow-xl sm:p-8">
          {setupPhase === "register" && !identified ? (
            <AccountStep
              notice={registerNotice}
              onGoToLogin={() => {
                signOut();
                router.replace("/login");
              }}
              onSso={(provider, name, email) => {
                const names = splitPersonName(name);
                const result = identifyRepresentative({
                  firstName: names.firstName,
                  lastName: names.lastName,
                  name,
                  email,
                  password: "",
                  passwordConfirm: "",
                  provider,
                });
                if (!result.ok) setRegisterNotice(result.message);
                else setRegisterNotice(null);
              }}
              onSubmit={(payload) => {
                const result = identifyRepresentative(payload);
                if (!result.ok) {
                  setRegisterNotice(result.message);
                  return;
                }
                setRegisterNotice(null);
              }}
            />
          ) : null}

          {setupPhase === "register" && identified ? (
            <CompanyStep
              representativeName={identity?.name || sessionUser.name}
              representativeEmail={identity?.email || sessionUser.email}
              signInLabel={
                identity?.provider === "google"
                  ? "Google"
                  : identity?.provider === "microsoft"
                    ? "Microsoft"
                    : "correo y clave"
              }
              defaults={{ company: tenant.name, rut: tenant.rut }}
              notice={registerNotice}
              onGoToLogin={() => {
                signOut();
                router.replace("/login");
              }}
              onSubmit={(payload) => {
                const result = completeRegister(payload);
                if (!result.ok) {
                  setRegisterNotice(result.message);
                  return;
                }
                setRegisterNotice(null);
              }}
            />
          ) : null}

          {setupPhase === "mode" ? (
            <OperatingModeStep
              company={tenant.name}
              activityType={tenant.activityType}
              operatingMode={operatingMode}
              onBack={() => goToSetupPhase("register")}
              onSubmit={(payload) => completeOperatingMode(payload)}
            />
          ) : null}

          {setupPhase === "structure" ? (
            <TenantStructureStep
              company={tenant.name}
              founderEmail={sessionUser.email}
              activityType={tenant.activityType}
              companySize={tenant.companySize}
              areas={areas}
              users={users}
              onBack={() => goToSetupPhase("mode")}
              onSubmit={(payload) => completeStructure(payload)}
            />
          ) : null}

          {setupPhase === "raci" ? (
            <ProfilesStep
              company={tenant.name}
              profiles={profiles}
              areas={areas}
              onBack={() => goToSetupPhase("structure")}
              onContinue={() => confirmRaci()}
            />
          ) : null}

          {setupPhase === "invites" ? (
            <TeamStep
              tenantName={tenant.name}
              tenantRut={tenant.rut}
              activityType={tenant.activityType}
              companySize={tenant.companySize}
              profiles={profiles}
              assignableProfiles={assignableProfiles}
              invites={invites}
              users={users}
              onBack={() => goToSetupPhase("raci")}
              onInvite={sendInvite}
              onAssignProfile={assignProfile}
              onClose={closeAndEnter}
            />
          ) : null}
        </div>

        <p className="mt-6 text-center text-[11px] text-white/60">
          OpenEVM · Ambiente local · rama Dev · Seminario de Grado UNAB · Uso académico
        </p>
      </div>
    </div>
  );
}

function AltaProgress({ stage }: { stage: "account" | "company" }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
      <span className={stage === "account" ? "text-[var(--brand)]" : ""}>1. Cuenta</span>
      {" · "}
      <span className={stage === "company" ? "text-[var(--brand)]" : ""}>2. Empresa</span>
    </p>
  );
}

function AccountStep({
  notice,
  onSubmit,
  onSso,
  onGoToLogin,
}: {
  notice?: string | null;
  onSubmit: (payload: RegisterPayload) => void;
  onSso: (provider: Exclude<SsoProvider, "email">, name: string, email: string) => void;
  onGoToLogin: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <AltaProgress stage="account" />
        <h1 className="mt-2 text-xl font-semibold sm:text-2xl">Cuenta del representante</h1>
        <p className="mt-2 text-sm text-slate-600">
          Primero te identificás. Podés entrar con Gmail, Microsoft o con correo y clave. Después cargás la empresa.
          Solo el representante invita al resto del equipo.
        </p>
      </div>
      <SsoLabPicker onSelect={(provider, profile) => onSso(provider, profile.name, profile.email)} />
      <div className="relative py-1 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="bg-white px-2">o con correo</span>
        <span className="absolute inset-x-0 top-1/2 -z-10 border-t border-slate-200" />
      </div>
      <form
        className="space-y-4"
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const firstName = String(form.get("firstName") ?? "").trim();
          const lastName = String(form.get("lastName") ?? "").trim();
          onSubmit({
            firstName,
            lastName,
            name: `${firstName} ${lastName}`.trim(),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            passwordConfirm: String(form.get("passwordConfirm") ?? ""),
            provider: "email",
          });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nombre</span>
            <input
              name="firstName"
              required
              autoComplete="off"
              placeholder="Nombre"
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Apellido</span>
            <input
              name="lastName"
              required
              autoComplete="off"
              placeholder="Apellido"
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Correo</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            placeholder="correo corporativo"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Clave de inicio de sesión</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Confirmar clave</span>
            <input
              name="passwordConfirm"
              type="password"
              required
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        {notice ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">{notice}</p> : null}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {notice ? (
            <button type="button" onClick={onGoToLogin} className="text-sm text-slate-600 underline">
              Ir a iniciar sesión
            </button>
          ) : null}
          <button
            type="submit"
            className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
          >
            Continuar a la empresa
          </button>
        </div>
      </form>
    </div>
  );
}

function CompanyStep({
  representativeName,
  representativeEmail,
  signInLabel,
  defaults,
  notice,
  onSubmit,
  onGoToLogin,
}: {
  representativeName: string;
  representativeEmail: string;
  signInLabel: string;
  defaults: CompanyPayload;
  notice?: string | null;
  onSubmit: (payload: CompanyPayload) => void;
  onGoToLogin: () => void;
}) {
  return (
    <form
      className="space-y-4"
      autoComplete="off"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSubmit({
          company: String(form.get("company") ?? ""),
          rut: String(form.get("rut") ?? ""),
        });
      }}
    >
      <div>
        <AltaProgress stage="company" />
        <h1 className="mt-2 text-xl font-semibold sm:text-2xl">Registro de la empresa</h1>
        <p className="mt-2 text-sm text-slate-600">
          Representante: <strong>{representativeName}</strong> ({representativeEmail}). Entrada con {signInLabel}.
          Al cerrar sesión vas a volver a entrar con esa cuenta.
        </p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Razón social</span>
        <input
          name="company"
          required
          autoComplete="off"
          defaultValue={defaults.company}
          placeholder="Razón Social Ltda"
          className="w-full rounded-md border border-slate-200 px-3 py-2"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Incluye el tipo societario que corresponda (Ltda., SpA, S.A., EIRL, etc.).
        </span>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">RUT de la empresa</span>
        <input
          name="rut"
          required
          autoComplete="off"
          defaultValue={defaults.rut}
          placeholder="12.345.678-9"
          className="w-full rounded-md border border-slate-200 px-3 py-2"
        />
      </label>
      {notice ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">{notice}</p> : null}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {notice ? (
          <button type="button" onClick={onGoToLogin} className="text-sm text-slate-600 underline">
            Ir a iniciar sesión
          </button>
        ) : null}
        <button
          type="submit"
          className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
        >
          Continuar a cómo trabajas
        </button>
      </div>
    </form>
  );
}

function ProfilesStep({
  company,
  profiles,
  areas,
  onBack,
  onContinue,
}: {
  company: string;
  profiles: OrgProfile[];
  areas: OrgArea[];
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Paso 4 · colaborativo</p>
        <h1 className="text-xl font-semibold sm:text-2xl">Perfiles</h1>
        <p className="mt-2 text-sm text-slate-600">
          {company}. Estos puestos salen de las áreas que registraste. Revísalos; los contactos ya
          quedan en Equipo. Después del alta puedes ajustar pantallas en <strong>Puestos</strong>.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {profiles.map((profile) => {
          const area = areas.find((item) => item.id === profile.areaId);
          return (
            <article key={profile.id} className="rounded-xl border border-slate-200 p-3">
              <h2 className="font-semibold">{profile.name}</h2>
              {area ? <p className="mt-0.5 text-xs text-slate-500">{area.name}</p> : null}
              <p className="mt-1 text-xs text-slate-600">{profile.description}</p>
            </article>
          );
        })}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Volver a áreas
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
        >
          Continuar a equipo
        </button>
      </div>
    </div>
  );
}

function TeamStep({
  tenantName,
  tenantRut,
  activityType,
  companySize,
  profiles,
  assignableProfiles,
  invites,
  users,
  onBack,
  onInvite,
  onAssignProfile,
  onClose,
}: {
  tenantName: string;
  tenantRut: string;
  activityType: string;
  companySize: string;
  profiles: OrgProfile[];
  assignableProfiles: OrgProfile[];
  invites: { id: string; name: string; email: string; profileId: string }[];
  users: TenantUser[];
  onBack: () => void;
  onInvite: (name: string, email: string, profileId: string) => boolean;
  onAssignProfile: (userId: string, profileId: string) => boolean;
  onClose: () => void;
}) {
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteProfileId, setInviteProfileId] = useState(assignableProfiles[0]?.id ?? "");
  const [handoverOk, setHandoverOk] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedProfile = assignableProfiles.find((item) => item.id === inviteProfileId);
  const firstOfRole = selectedProfile ? isFirstOfRole(users, selectedProfile.role) : false;
  const extraPeople = users.filter((item) => item.active && item.role !== "owner");

  function profileName(profileId: string) {
    return profiles.find((item) => item.id === profileId)?.name ?? "Sin perfil";
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Paso 5 · colaborativo</p>
        <h1 className="text-xl font-semibold sm:text-2xl">Equipo</h1>
        <p className="mt-2 text-sm text-slate-600">
          Los contactos de cada área ya están. Aquí puedes sumar más gente o cerrar el alta.
        </p>
      </div>

      {assignableProfiles.length ? (
      <form
        className="space-y-3"
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          if (!inviteProfileId) {
            setNotice("Elige un perfil existente.");
            return;
          }
          if (firstOfRole && !handoverOk) {
            setNotice("Marca que entendiste el recorte de permisos para continuar.");
            return;
          }
          const ok = onInvite(inviteName, inviteEmail, inviteProfileId);
          setNotice(
            ok
              ? `Listo: ${inviteName} queda con el perfil ${profileName(inviteProfileId)}.`
              : "Revisa el nombre, el correo o si esa persona ya está.",
          );
          if (ok) {
            setInviteName("");
            setInviteEmail("");
            setHandoverOk(false);
          }
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nombre</span>
            <input
              required
              autoComplete="off"
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              placeholder="Nombre de colaborador"
              className="w-full rounded-md border border-slate-200 px-3 py-3 sm:py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Correo corporativo</span>
            <input
              type="email"
              required
              autoComplete="off"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="colaborador@openevm.cl"
              className="w-full rounded-md border border-slate-200 px-3 py-3 sm:py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Perfil</span>
          <select
            required
            value={inviteProfileId}
            onChange={(event) => {
              setInviteProfileId(event.target.value);
              setHandoverOk(false);
            }}
            className="w-full rounded-md border border-slate-200 px-3 py-3 sm:py-2"
          >
            {assignableProfiles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {selectedProfile ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-medium">{inviteName.trim() || "Este colaborador"}</span> quedará con el
            perfil <strong>{selectedProfile.name}</strong>: {selectedProfile.description}
          </p>
        ) : null}
        {selectedProfile && firstOfRole ? (
          <HandoverConfirm
            role={selectedProfile.role}
            personName={inviteName || undefined}
            checked={handoverOk}
            onChecked={setHandoverOk}
          />
        ) : selectedProfile && !firstOfRole ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Ya hay alguien con el perfil {selectedProfile.name}. Esta persona se suma al mismo; tus
            permisos no cambian otra vez.
          </p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            className="min-h-11 rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
          >
            Agregar persona
          </button>
        </div>
      </form>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Profesional independiente: solo está Dirección. Si más adelante hay equipo, pasa a colaborativo
          desde el panel (pestaña Modo en Inicio).
        </p>
      )}

      {notice ? <p className="text-sm text-slate-700">{notice}</p> : null}

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {invites.length ? (
          invites.map((item) => {
            const user = users.find((person) => person.email === item.email);
            return (
              <li key={item.id} className="flex flex-col gap-2 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 truncate font-medium">{item.name}</span>
                {user ? (
                  <select
                    aria-label={`Perfil de ${item.name}`}
                    value={user.profileId}
                    onChange={(event) => onAssignProfile(user.id, event.target.value)}
                    className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                  >
                    {assignableProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-slate-500">{profileName(item.profileId)}</span>
                )}
              </li>
            );
          })
        ) : (
          <li className="px-3 py-4 text-sm text-slate-500">
          No hay más personas que los contactos de área. Puedes cerrar el alta o sumar a alguien.
          </li>
        )}
      </ul>

      <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        <p className="font-semibold">Resumen y cierre</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>
            Empresa: <strong>{tenantName || "—"}</strong>
            {tenantRut ? ` · RUT ${tenantRut}` : ""}
          </li>
          <li>
            Actividad: <strong>{activityTypeLabel(activityType) || "—"}</strong>
            {companySize ? ` · ${PRESET_LABEL[companySize as keyof typeof PRESET_LABEL] ?? companySize}` : ""}
          </li>
          <li>
            Proyecto de capacitación: se crea al registrar el primer cliente, no en este paso.
          </li>
          <li>
            Perfiles: <strong>{profiles.map((item) => item.name).join(", ")}</strong>
          </li>
          <li>
            Equipo:{" "}
            <strong>
              {extraPeople.length
                ? extraPeople.map((item) => `${item.name} → ${profileName(item.profileId)}`).join("; ")
                : "solo tú (Administrador)"}
            </strong>
          </li>
        </ul>
        <p className="text-xs text-emerald-800">
          Al cerrar, entras a Inicio: ahí ves qué datos del proyecto faltan (cliente, kickoff,
          presupuesto, calendario) según si trabajas solo o con equipo.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Volver a perfiles
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--brand-dark)]"
        >
          {extraPeople.length ? "Cerrar alta y registrar clientes" : "Continuar a clientes y proyectos"}
        </button>
      </div>
    </div>
  );
}
