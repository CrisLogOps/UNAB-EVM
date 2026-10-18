"use client";

import { useMemo, useState } from "react";
import {
  ERP_PLATFORM_OPTIONS,
  SIGNATURE_PROVIDER_OPTIONS,
  SII_INVOICE_OPTIONS,
  erpPlatformLabel,
  integrationPreview,
  normalizeTenantIntegrations,
  signatureProviderLabel,
  siiInvoiceLabel,
} from "@/lib/tenant-integrations";
import type { Tenant, TenantIntegrations } from "@/lib/types";

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        ok ? "bg-amber-100 text-amber-950" : "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

export function TenantIntegrationsPanel({
  tenant,
  onSave,
}: {
  tenant: Tenant;
  onSave: (integrations: TenantIntegrations) => void;
}) {
  const [draft, setDraft] = useState<TenantIntegrations>(() => normalizeTenantIntegrations(tenant.integrations));
  const [saved, setSaved] = useState(false);
  const preview = useMemo(() => integrationPreview(draft), [draft]);

  function patchSignature(partial: Partial<TenantIntegrations["signature"]>) {
    setDraft((current) => ({ ...current, signature: { ...current.signature, ...partial } }));
    setSaved(false);
  }
  function patchSii(partial: Partial<TenantIntegrations["sii"]>) {
    setDraft((current) => ({ ...current, sii: { ...current.sii, ...partial } }));
    setSaved(false);
  }
  function patchErp(partial: Partial<TenantIntegrations["erp"]>) {
    setDraft((current) => ({ ...current, erp: { ...current.erp, ...partial } }));
    setSaved(false);
  }

  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Próximas versiones</p>
        <h2 className="text-lg font-semibold">Antecedentes de integración</h2>
        <p className="text-sm text-slate-600">
          Firma electrónica avanzada, SII y ERP. Quedan registrados como evidencia de lo que se conectará
          más adelante. OpenEVM aún no firma ni declara al SII: esto documenta cómo se verá y qué hay que
          considerar en versiones posteriores.
        </p>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-950">
        Integración planificada, no activa. No se pide clave tributaria ni el archivo del certificado: solo
        si existen, quién los emite y si ya hay un software que publica al SII.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(draft);
            setSaved(true);
          }}
        >
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Firma electrónica avanzada (FEA)</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.signature.hasCertificate}
                onChange={(event) => patchSignature({ hasCertificate: event.target.checked })}
              />
              La empresa tiene certificado FEA para firmar documentos
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Proveedor</span>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={draft.signature.provider}
                onChange={(event) =>
                  patchSignature({ provider: event.target.value as TenantIntegrations["signature"]["provider"] })
                }
              >
                {SIGNATURE_PROVIDER_OPTIONS.map((item) => (
                  <option key={item.value || "none"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {draft.signature.provider === "other" ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Nombre del proveedor</span>
                <input
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                  value={draft.signature.providerOther}
                  onChange={(event) => patchSignature({ providerOther: event.target.value })}
                />
              </label>
            ) : null}
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Titular del certificado</span>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={draft.signature.holder}
                onChange={(event) => patchSignature({ holder: event.target.value })}
                placeholder="Representante o razón social"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Vencimiento</span>
              <input
                type="date"
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={draft.signature.expiresOn}
                onChange={(event) => patchSignature({ expiresOn: event.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Para qué se usaría</span>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={draft.signature.usedFor}
                onChange={(event) => patchSignature({ usedFor: event.target.value })}
                placeholder="Libro de obra, contratos, DTE, actas…"
              />
            </label>
          </fieldset>

          <fieldset className="space-y-2 border-t border-slate-100 pt-3">
            <legend className="text-sm font-semibold">Servicio de Impuestos Internos</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.sii.hasSiiAccess}
                onChange={(event) => patchSii({ hasSiiAccess: event.target.checked })}
              />
              Hay acceso SII (clave tributaria o certificado) para esta empresa
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Documentos que emite</span>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={draft.sii.invoiceMode}
                onChange={(event) =>
                  patchSii({ invoiceMode: event.target.value as TenantIntegrations["sii"]["invoiceMode"] })
                }
              >
                {SII_INVOICE_OPTIONS.map((item) => (
                  <option key={item.value || "none"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Unidad / oficina SII</span>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={draft.sii.office}
                onChange={(event) => patchSii({ office: event.target.value })}
                placeholder="Opcional"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Notas</span>
              <textarea
                rows={2}
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={draft.sii.notes}
                onChange={(event) => patchSii({ notes: event.target.value })}
                placeholder="Ambiente de certificación, representante electrónico, etc."
              />
            </label>
          </fieldset>

          <fieldset className="space-y-2 border-t border-slate-100 pt-3">
            <legend className="text-sm font-semibold">ERP u otra plataforma</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.erp.hasErp}
                onChange={(event) => patchErp({ hasErp: event.target.checked })}
              />
              La organización ya tiene un ERP o software contable
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Plataforma</span>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={draft.erp.platform}
                onChange={(event) =>
                  patchErp({ platform: event.target.value as TenantIntegrations["erp"]["platform"] })
                }
              >
                {ERP_PLATFORM_OPTIONS.map((item) => (
                  <option key={item.value || "none"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {draft.erp.platform === "other" ? (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Nombre del sistema</span>
                <input
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                  value={draft.erp.platformOther}
                  onChange={(event) => patchErp({ platformOther: event.target.value })}
                />
              </label>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.erp.postsToSii}
                onChange={(event) => patchErp({ postsToSii: event.target.checked })}
                disabled={!draft.erp.hasErp}
              />
              Ese sistema ya carga o declara documentos al SII
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Módulos relevantes</span>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={draft.erp.modules}
                onChange={(event) => patchErp({ modules: event.target.value })}
                placeholder="Contabilidad, remuneraciones, tesorería…"
                disabled={!draft.erp.hasErp}
              />
            </label>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
            >
              Guardar antecedentes
            </button>
            {saved ? <p className="text-xs text-emerald-800">Quedaron registrados en esta empresa (ambiente local).</p> : null}
          </div>
        </form>

        <aside className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Vista previa · versión posterior</p>
            <StatusPill ok={preview.recorded} label={preview.recorded ? "Antecedente registrado" : "Sin registrar"} />
          </div>
          <p className="text-xs text-slate-500">
            Así podría verse el panel cuando OpenEVM se conecte. Los botones no envían nada todavía.
          </p>

          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Firma electrónica avanzada</p>
              <StatusPill
                ok={preview.signatureReady}
                label={preview.signatureReady ? "Lista para integrar" : "Pendiente"}
              />
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {preview.signatureReady
                ? `${signatureProviderLabel(draft.signature.provider, draft.signature.providerOther)} · titular ${draft.signature.holder || tenant.name || "—"} · vence ${draft.signature.expiresOn || "s/f"}`
                : "Cuando exista FEA, el libro de obra y las actas se podrán firmar aquí sin salir de OpenEVM."}
            </p>
            <p className="mt-2 rounded-md bg-slate-50 px-2 py-1.5 text-[11px] text-slate-500">
              Último documento firmado: {preview.signatureReady ? "— (se mostrará al integrar)" : "no aplica aún"}
            </p>
            <button type="button" disabled className="mt-2 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400">
              Firmar documento (próxima versión)
            </button>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">SII</p>
              <StatusPill ok={preview.siiReady} label={preview.siiReady ? "Acceso declarado" : "Sin acceso"} />
            </div>
            <p className="mt-1 text-xs text-slate-600">
              RUT {tenant.rut || "s/RUT"} · {siiInvoiceLabel(draft.sii.invoiceMode)}
              {draft.sii.office ? ` · ${draft.sii.office}` : ""}
            </p>
            <p className="mt-2 rounded-md bg-slate-50 px-2 py-1.5 text-[11px] text-slate-500">
              Última sincronización: — · canal{" "}
              {preview.siiPath === "erp"
                ? `vía ERP (${erpPlatformLabel(draft.erp.platform, draft.erp.platformOther)})`
                : preview.siiPath === "directo"
                  ? "directo a SII (planificado)"
                  : "pendiente"}
            </p>
            <button type="button" disabled className="mt-2 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400">
              Conectar SII (próxima versión)
            </button>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">ERP / plataforma</p>
              <StatusPill
                ok={preview.erpReady}
                label={preview.erpReady ? (draft.erp.postsToSii ? "Publica al SII" : "Interno, sin SII") : "No hay ERP"}
              />
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {preview.erpReady
                ? `${erpPlatformLabel(draft.erp.platform, draft.erp.platformOther)}${draft.erp.modules ? ` · ${draft.erp.modules}` : ""}`
                : "Si más adelante hay Softland, Defontana u otro, OpenEVM podrá empujar o leer DTE desde ahí en vez de hablar solo con el SII."}
            </p>
            <button type="button" disabled className="mt-2 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400">
              Vincular ERP (próxima versión)
            </button>
          </article>
        </aside>
      </div>
    </section>
  );
}
