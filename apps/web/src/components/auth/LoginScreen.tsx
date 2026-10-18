"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { OpenEvmMark } from "@/components/brand/OpenEvmMark";
import { SsoLabPicker } from "@/components/auth/SsoLabPicker";
import { useOrg } from "@/components/layout/OrgProvider";
import { PASSWORD_MIN_LENGTH } from "@/lib/identity";
import { HOME_HREF } from "@/lib/startup-flow";

type Panel = "login" | "exists";

export function LoginScreen() {
  const router = useRouter();
  const {
    tenant,
    setupPhase,
    users,
    loginWithPassword,
    loginWithSso,
    requestPasswordReset,
    completePasswordReset,
    continueAsFounder,
    beginRegistration,
    signOut,
  } = useOrg();

  const [panel, setPanel] = useState<Panel>("login");
  const [notice, setNotice] = useState<string | null>(null);
  const [existsEmail, setExistsEmail] = useState("");
  const [resetReady, setResetReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [replaceReady, setReplaceReady] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const founder = users.find((item) => item.role === "owner" && item.email.includes("@"));
  const canContinueFounder = setupPhase === "done" && Boolean(founder?.email);

  function go(result: { ok: true; next: "path" | "app" | "setup"; intro?: boolean }) {
    if (result.next === "app") router.replace(result.intro ? "/intro" : HOME_HREF);
    else if (result.next === "setup") router.replace("/setup");
  }

  function handleLogin(event: FormEvent) {
    event.preventDefault();
    const result = loginWithPassword(loginEmail, loginPassword);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    go(result);
  }

  function handleSsoLogin(provider: "google" | "microsoft", name: string, email: string) {
    setNotice(null);
    const result = loginWithSso(provider, name, email);
    if (!result.ok) {
      if (result.code === "replace-needed") {
        setReplaceReady(true);
      }
      setNotice(result.message);
      return;
    }
    go(result);
  }

  function startAlta(replaceExisting?: boolean) {
    setNotice(null);
    const result = beginRegistration({ replaceExisting });
    if (!result.ok) {
      if ("needsConfirm" in result && result.needsConfirm) {
        setReplaceReady(true);
        setNotice(`Ya existe ${result.tenantName} en este navegador. Confirmá reemplazar para registrar otra empresa.`);
        return;
      }
      setNotice(result.message ?? "No se pudo iniciar el alta.");
      return;
    }
    router.replace("/setup");
  }

  function handleFounder() {
    const result = continueAsFounder();
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    go(result);
  }

  return (
    <div className="min-h-screen bg-[var(--brand)] text-white">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-3 py-6 sm:px-6 sm:py-8">
        <header className="mb-6">
          <OpenEvmMark variant="light" />
        </header>

        <div className="flex-1 rounded-2xl bg-white p-4 text-[var(--foreground)] shadow-xl sm:p-8">
          {panel === "login" ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <SsoLabPicker onSelect={(provider, profile) => handleSsoLogin(provider, profile.name, profile.email)} />
              <div className="relative py-1 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                <span className="bg-white px-2">o con correo</span>
                <span className="absolute inset-x-0 top-1/2 -z-10 border-t border-slate-200" />
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Correo</span>
                <input
                  required
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                  placeholder="correo corporativo"
                  autoComplete="username"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Clave</span>
                <input
                  required
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="current-password"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
              >
                Iniciar sesión
              </button>
              {canContinueFounder ? (
                <button
                  type="button"
                  onClick={handleFounder}
                  className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-950 hover:bg-emerald-100"
                >
                  Continuar como {founder?.name || "representante"} ({founder?.email})
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setExistsEmail(loginEmail.trim().toLowerCase());
                  setNotice(null);
                  setResetReady(false);
                  setPanel("exists");
                }}
                className="w-full text-sm text-slate-600 underline"
              >
                Olvidé la clave
              </button>
              <div className="border-t border-slate-200 pt-4">
                <p className="mb-3 text-sm text-slate-600">
                  El representante registra la empresa. Si te invitaron en Personas, entra con el
                  correo y la clave que te asignaron.
                </p>
                <button
                  type="button"
                  onClick={() => startAlta()}
                  className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Registrate
                </button>
                {replaceReady ? (
                  <button
                    type="button"
                    onClick={() => startAlta(true)}
                    className="mt-3 w-full rounded-md bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700"
                  >
                    Reemplazar el ambiente de este navegador e iniciar el alta
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}

          {panel === "exists" ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold sm:text-2xl">Reiniciar la clave</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Si {existsEmail || "esta cuenta"} ya está registrada, podés solicitar reiniciar la clave o volver a
                  Iniciar sesión.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const result = requestPasswordReset(existsEmail || loginEmail);
                  setNotice(result.message);
                  if (result.ok) setResetReady(true);
                }}
                className="w-full rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
              >
                Enviar solicitud para reiniciar la clave
              </button>
              {resetReady ? (
                <form
                  className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const result = completePasswordReset(existsEmail || loginEmail, newPassword);
                    setNotice(result.message);
                    if (result.ok) {
                      setResetReady(false);
                      setNewPassword("");
                      signOut();
                      setLoginEmail(existsEmail || loginEmail);
                      setPanel("login");
                    }
                  }}
                >
                  <p className="text-sm font-medium">Nueva clave</p>
                  <input
                    required
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
                    minLength={PASSWORD_MIN_LENGTH}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Guardar y ir a Iniciar sesión
                  </button>
                </form>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setLoginEmail(existsEmail || loginEmail);
                  setNotice(null);
                  setResetReady(false);
                  setPanel("login");
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50"
              >
                Volver a Iniciar sesión
              </button>
              {tenant.name ? <p className="text-xs text-slate-500">Ambiente en este navegador: {tenant.name}</p> : null}
            </div>
          ) : null}

          {notice ? <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">{notice}</p> : null}
        </div>

        <p className="mt-6 text-center text-[11px] text-white/60">
          Ambiente local · rama Dev · Seminario de Grado UNAB · Uso académico
        </p>
      </div>
    </div>
  );
}
