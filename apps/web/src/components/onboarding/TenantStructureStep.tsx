"use client";

import { useMemo, useState } from "react";
import { COMPANY_PRESETS, areaCountInRange, presetById, type CompanySize } from "@/lib/company-presets";
import { ROLE_LABELS } from "@/lib/constants";
import { RACI_ROLES } from "@/lib/raci";
import {
  ACTIVITY_TYPES,
  AREA_CATALOG,
  DIRECTION_AREA_ID,
  emptyAreaDraft,
  suggestedAreaIds,
  type AreaDraft,
} from "@/lib/tenant-setup";
import type { OrgArea, TenantUser, UserRole } from "@/lib/types";
import type { StructurePayload } from "@/components/layout/OrgProvider";

const OPTIONAL_AREAS = AREA_CATALOG.filter((item) => item.id !== DIRECTION_AREA_ID);
const CUSTOM_ROLES = RACI_ROLES.filter((role) => role !== "owner" && role !== "viewer");

export function TenantStructureStep({
  company,
  founderEmail,
  activityType,
  companySize,
  areas,
  users,
  onBack,
  onSubmit,
}: {
  company: string;
  founderEmail: string;
  activityType: string;
  companySize: CompanySize | "";
  areas: OrgArea[];
  users: TenantUser[];
  onBack: () => void;
  onSubmit: (payload: StructurePayload) => void;
}) {
  const [activity, setActivity] = useState(activityType);
  const [activityOther, setActivityOther] = useState(
    activityType && !ACTIVITY_TYPES.some((item) => item.id === activityType) ? activityType : "",
  );
  const [size, setSize] = useState<CompanySize | "">(companySize);
  const [drafts, setDrafts] = useState<Record<string, AreaDraft>>(() => seedDrafts(areas, users));
  const [selected, setSelected] = useState<string[]>(() =>
    companySize
      ? areas.filter((item) => item.enabled && item.id !== DIRECTION_AREA_ID).map((item) => item.id)
      : [],
  );
  const [customAreas, setCustomAreas] = useState<AreaDraft[]>(() =>
    areas.filter((item) => item.enabled && !AREA_CATALOG.some((catalog) => catalog.id === item.id)).map((item) => {
      const contact = users.find((user) => user.areaId === item.id && user.role !== "owner");
      return {
        id: item.id,
        name: item.name,
        role: item.role,
        description: item.description,
        headcount: item.headcount || 1,
        contactName: contact?.name ?? "",
        contactEmail: contact?.email ?? "",
        custom: true,
      };
    }),
  );
  const [error, setError] = useState<string | null>(null);

  const preset = size ? presetById(size) : null;
  const areaCount = 1 + selected.length + customAreas.length;

  const selectedDrafts = useMemo(
    () => selected.map((id) => drafts[id]).filter(Boolean),
    [selected, drafts],
  );

  function applySize(next: CompanySize) {
    setSize(next);
    setError(null);
    const suggested = suggestedAreaIds(next).filter((id) => id !== DIRECTION_AREA_ID);
    setSelected(suggested);
    setDrafts((current) => {
      const nextDrafts = { ...current };
      suggested.forEach((id) => {
        if (nextDrafts[id]) return;
        const catalog = OPTIONAL_AREAS.find((item) => item.id === id);
        if (catalog) nextDrafts[id] = emptyAreaDraft(catalog);
      });
      return nextDrafts;
    });
    if (next === "independent") setCustomAreas([]);
  }

  function toggleArea(id: string) {
    setError(null);
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      const catalog = OPTIONAL_AREAS.find((item) => item.id === id);
      if (catalog) {
        setDrafts((draftsCurrent) => ({
          ...draftsCurrent,
          [id]: draftsCurrent[id] ?? emptyAreaDraft(catalog),
        }));
      }
      return [...current, id];
    });
  }

  function patchDraft(id: string, patch: Partial<AreaDraft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  function addCustomArea() {
    setCustomAreas((current) => [
      ...current,
      {
        id: `area-custom-${Date.now()}`,
        name: "",
        role: "oficina_tecnica",
        description: "Área personalizada",
        headcount: 1,
        contactName: "",
        contactEmail: "",
        custom: true,
      },
    ]);
  }

  function submit() {
    if (!activity || (activity === "otro" && !activityOther.trim())) {
      setError("Elige el tipo de actividad de la empresa.");
      return;
    }
    if (!size || !preset) {
      setError("Selecciona el tamaño según la cantidad de áreas.");
      return;
    }
    if (!areaCountInRange(size, areaCount)) {
      setError(
        `Para ${preset.label} registra entre ${preset.minAreas} y ${preset.maxAreas} áreas (incluye Dirección). Ahora van ${areaCount}.`,
      );
      return;
    }
    if (size !== "independent") {
      const incomplete = [...selectedDrafts, ...customAreas].find(
        (item) => !item.name.trim() || item.headcount < 1 || !item.contactName.trim() || !item.contactEmail.includes("@"),
      );
      if (incomplete) {
        setError("Cada área (además de Dirección) necesita nombre, al menos 1 colaborador y un contacto con correo.");
        return;
      }
      const emails = [...selectedDrafts, ...customAreas].map((item) => item.contactEmail.trim().toLowerCase());
      if (emails.includes(founderEmail.trim().toLowerCase())) {
        setError("El contacto de un área no puede ser el mismo correo del representante. Dirección ya lo cubre.");
        return;
      }
      if (new Set(emails).size !== emails.length) {
        setError("Cada área debe tener un contacto distinto (un correo por área).");
        return;
      }
    }

    onSubmit({
      activityType: activity === "otro" ? activityOther.trim() : activity,
      companySize: size,
      areas: size === "independent" ? [] : [...selectedDrafts, ...customAreas],
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Paso 2 de 4 · Setup 0</p>
        <h1 className="text-xl font-semibold sm:text-2xl">Actividad y áreas</h1>
        <p className="mt-2 text-sm text-slate-600">
          {company || "Tu empresa"}: el tamaño se elige por <strong>cantidad de áreas</strong>, no por
          facturación. Cada área (salvo Dirección) registra colaboradores y al menos un contacto. Después
          siguen perfiles y equipo.
        </p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Tipo de actividad</span>
        <select
          required
          value={activity}
          onChange={(event) => setActivity(event.target.value)}
          className="w-full rounded-md border border-slate-200 px-3 py-2"
        >
          <option value="">Selecciona una actividad</option>
          {ACTIVITY_TYPES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {activity === "otro" ? (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Describe la actividad</span>
          <input
            value={activityOther}
            onChange={(event) => setActivityOther(event.target.value)}
            placeholder="Ej. conservaciones viales"
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-medium">Tamaño según áreas existentes</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {COMPANY_PRESETS.map((item) => {
            const active = size === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => applySize(item.id)}
                className={`rounded-xl border p-3 text-left ${
                  active ? "border-[var(--brand)] bg-slate-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">{item.typicalHeadcount}</p>
                <p className="font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-slate-600">{item.whatItMeans}</p>
              </button>
            );
          })}
        </div>
      </div>

      {size ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Áreas registradas: <strong>{areaCount}</strong>
          {preset ? ` · rango ${preset.minAreas}–${preset.maxAreas}` : ""} (incluye Dirección, contacto: el
          representante).
        </p>
      ) : null}

      {size && size !== "independent" ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">Áreas de ejemplo</p>
          {OPTIONAL_AREAS.map((item) => {
            const on = selected.includes(item.id);
            const draft = drafts[item.id];
            return (
              <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={on} onChange={() => toggleArea(item.id)} className="mt-1" />
                  <span>
                    <span className="font-semibold">{item.name}</span>
                    <span className="block text-xs text-slate-500">
                      {item.example}. {item.description}
                    </span>
                  </span>
                </label>
                {on && draft ? (
                  <AreaContactFields
                    draft={draft}
                    onChange={(patch) => patchDraft(item.id, patch)}
                  />
                ) : null}
              </article>
            );
          })}

          {customAreas.map((item, index) => (
            <article key={item.id} className="rounded-xl border border-dashed border-slate-300 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Otra área</p>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-800"
                  onClick={() => setCustomAreas((current) => current.filter((area) => area.id !== item.id))}
                >
                  Quitar
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Nombre del área</span>
                  <input
                    value={item.name}
                    onChange={(event) =>
                      setCustomAreas((current) =>
                        current.map((area) => (area.id === item.id ? { ...area, name: event.target.value } : area)),
                      )
                    }
                    placeholder="Ej. Oficina técnica"
                    className="w-full rounded-md border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Puesto asociado</span>
                  <select
                    value={item.role}
                    onChange={(event) =>
                      setCustomAreas((current) =>
                        current.map((area) =>
                          area.id === item.id ? { ...area, role: event.target.value as UserRole } : area,
                        ),
                      )
                    }
                    className="w-full rounded-md border border-slate-200 px-3 py-2"
                  >
                    {CUSTOM_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <AreaContactFields
                draft={item}
                onChange={(patch) =>
                  setCustomAreas((current) =>
                    current.map((area, idx) => (idx === index ? { ...area, ...patch } : area)),
                  )
                }
              />
            </article>
          ))}

          <button
            type="button"
            onClick={addCustomArea}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Agregar otra área
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Volver a empresa
        </button>
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
        >
          Continuar a perfiles
        </button>
      </div>
    </div>
  );
}

function AreaContactFields({
  draft,
  onChange,
}: {
  draft: AreaDraft;
  onChange: (patch: Partial<AreaDraft>) => void;
}) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Colaboradores</span>
        <input
          type="number"
          min={1}
          value={draft.headcount}
          onChange={(event) => onChange({ headcount: Math.max(1, Number(event.target.value) || 1) })}
          className="w-full rounded-md border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="block text-sm sm:col-span-1">
        <span className="mb-1 block font-medium">Contacto</span>
        <input
          value={draft.contactName}
          onChange={(event) => onChange({ contactName: event.target.value })}
          placeholder="Nombre y apellido"
          className="w-full rounded-md border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Correo del contacto</span>
        <input
          type="email"
          value={draft.contactEmail}
          onChange={(event) => onChange({ contactEmail: event.target.value })}
          placeholder="contacto@empresa.cl"
          className="w-full rounded-md border border-slate-200 px-3 py-2"
        />
      </label>
    </div>
  );
}

function seedDrafts(areas: OrgArea[], users: TenantUser[]) {
  const next: Record<string, AreaDraft> = {};
  OPTIONAL_AREAS.forEach((catalog) => {
    const area = areas.find((item) => item.id === catalog.id);
    const contact = users.find((user) => user.areaId === catalog.id && user.role !== "owner");
    next[catalog.id] = {
      ...emptyAreaDraft(catalog),
      name: area?.name ?? catalog.name,
      headcount: area?.headcount || catalog.defaultHeadcount,
      contactName: contact?.name ?? "",
      contactEmail: contact?.email ?? "",
    };
  });
  return next;
}
