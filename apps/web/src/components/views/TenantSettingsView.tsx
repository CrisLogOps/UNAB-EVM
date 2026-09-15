"use client";

import { useRoleContext } from "@/components/layout/RoleProvider";
import { useOrg } from "@/components/layout/OrgProvider";
import { PRESET_LABEL } from "@/lib/company-presets";
import { activityTypeLabel } from "@/lib/tenant-setup";

export function TenantSettingsView() {
  const { tenant } = useRoleContext();
  const { sessionUser, areas } = useOrg();
  const enabledAreas = areas.filter((item) => item.enabled);

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Datos de tu empresa</p>
        <h1 className="text-2xl font-semibold">Empresa</h1>
        <p className="text-sm text-slate-600">
          Tenant creado en el setup 0: representante, RUT, razón social, actividad y áreas.
        </p>
      </div>
      <form className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
          <input className="w-full rounded-md border border-slate-200 px-3 py-2" defaultValue={tenant.name} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">RUT</span>
          <input className="w-full rounded-md border border-slate-200 px-3 py-2" defaultValue={tenant.rut} />
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
        <p className="text-xs text-slate-500">Ambiente local: los cambios no se guardan en servidor.</p>
        <button type="button" className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]">
          Guardar
        </button>
      </form>
    </div>
  );
}
