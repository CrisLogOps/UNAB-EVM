"use client";

import { useState } from "react";
import { useRoleContext } from "@/components/layout/RoleProvider";
import { useOrg } from "@/components/layout/OrgProvider";
import { OperatingModeSwitch } from "@/components/layout/OperatingModeSwitch";
import { TenantIntegrationsPanel } from "@/components/views/TenantIntegrationsPanel";
import { PRESET_LABEL } from "@/lib/company-presets";
import { OPERATING_MODE_LABEL, resolveOperatingMode } from "@/lib/operating-mode";
import { activityTypeLabel } from "@/lib/tenant-setup";

export function TenantSettingsView() {
  const { tenant } = useRoleContext();
  const { sessionUser, areas, updateTenant, canOperate } = useOrg();
  const enabledAreas = areas.filter((item) => item.enabled);
  const mode = resolveOperatingMode(tenant);
  const canEdit = canOperate("tenant:settings");
  const [name, setName] = useState(tenant.name);
  const [rut, setRut] = useState(tenant.rut);
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Datos de tu empresa</p>
        <h1 className="text-2xl font-semibold">Empresa</h1>
        <p className="text-sm text-slate-600">
          Razón social, RUT y modo de trabajo. Más abajo se registran los antecedentes de firma electrónica,
          SII y ERP para versiones posteriores.
        </p>
      </div>
      <OperatingModeSwitch variant="panel" />
      <form
        className="max-w-xl space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          updateTenant({ name: name.trim() || tenant.name, rut: rut.trim() });
          setSaved(true);
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Nombre del representante</span>
          <input className="w-full rounded-md border border-slate-200 px-3 py-2" defaultValue={sessionUser.name} readOnly />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Correo del representante</span>
          <input className="w-full rounded-md border border-slate-200 px-3 py-2" defaultValue={sessionUser.email} readOnly />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Razón social</span>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
            readOnly={!canEdit}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">RUT</span>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2"
            value={rut}
            onChange={(event) => {
              setRut(event.target.value);
              setSaved(false);
            }}
            readOnly={!canEdit}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Tipo de actividad</span>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2"
            defaultValue={activityTypeLabel(tenant.activityType)}
            readOnly
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Modo de trabajo</span>
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2"
            defaultValue={mode ? OPERATING_MODE_LABEL[mode] : "—"}
            readOnly
          />
        </label>
        {mode === "individual" ? null : (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Tamaño (por áreas)</span>
            <input
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              defaultValue={
                tenant.companySize
                  ? `${PRESET_LABEL[tenant.companySize]} · ${enabledAreas.length} área${enabledAreas.length === 1 ? "" : "s"}`
                  : "—"
              }
              readOnly
            />
          </label>
        )}
        <p className="text-xs text-slate-500">Ambiente local: los cambios no se guardan en servidor.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canEdit}
            className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)] disabled:opacity-40"
          >
            Guardar
          </button>
          {saved ? <p className="text-xs text-emerald-800">Datos de la empresa actualizados.</p> : null}
        </div>
      </form>

      <TenantIntegrationsPanel tenant={tenant} onSave={(integrations) => updateTenant({ integrations })} />
    </div>
  );
}
