"use client";

import Link from "next/link";
import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { ModalForm } from "@/components/forms/ModalForm";
import { useOrg } from "@/components/layout/OrgProvider";
import {
  COMPANY_PRESETS,
  PRESET_LABEL,
  detectCompanySize,
  presetsIncludingRole,
  screensForRole,
} from "@/lib/company-presets";
import { ROLE_LABELS } from "@/lib/constants";
import { ROLE_GUIDE } from "@/lib/raci-guide";
import { RACI_ROLES } from "@/lib/raci";
import type { UserRole } from "@/lib/types";

export function AreasAdminView() {
  const { areas, applySizePreset, toggleArea, addArea } = useOrg();
  const [open, setOpen] = useState(false);
  const current = detectCompanySize(areas);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Tamaño de la empresa</p>
        <h1 className="text-2xl font-semibold">Áreas</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          El tamaño se define por <strong>cantidad de áreas</strong> (independiente, pequeña, mediana o
          gran empresa). Cada paquete enciende o apaga áreas. Las tareas extra del gerente se marcan en{" "}
          <Link href="/profiles" className="underline">
            Puestos
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {COMPANY_PRESETS.map((preset) => {
          const selected = current === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applySizePreset(preset.id)}
              className={`rounded-xl border p-4 text-left shadow-sm ${
                selected ? "border-[var(--accent)] bg-emerald-50" : "border-zinc-200 bg-white hover:border-[var(--accent)]"
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{preset.typicalHeadcount}</p>
              <h2 className="mt-1 font-semibold">{preset.label}</h2>
              <p className="text-xs text-slate-500">{preset.subtitle}</p>
              <p className="mt-2 text-sm text-slate-700">{preset.whatItMeans}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                {preset.roles.map((role) => (
                  <li key={role}>
                    <strong>{ROLE_LABELS[role]}</strong>
                    {ROLE_GUIDE[role]?.duties?.length ? ` · ${ROLE_GUIDE[role].duties.join(", ")}` : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">{preset.howPmAdapts}</p>
              <p className="mt-2 text-xs font-medium text-[var(--brand)]">
                {selected ? "Paquete activo" : "Usar este paquete"}
              </p>
            </button>
          );
        })}
      </div>

      {current === "custom" ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          El mix de áreas está personalizado (no coincide exacto con independiente, pequeña, mediana o grande).
        </p>
      ) : null}

      <p className="text-sm text-slate-600">
        Tabla: qué área existe, qué puesto usa, en qué paquete viene y qué pantallas trae ese puesto.
      </p>

      <DataTable
        columns={[
          { key: "name", header: "Área", accessor: "name" },
          {
            key: "headcount",
            header: "Colaboradores",
            render: (row) => String(row.headcount || 1),
          },
          {
            key: "role",
            header: "Puesto",
            render: (row) => ROLE_LABELS[row.role],
          },
          {
            key: "packs",
            header: "En paquetes",
            render: (row) =>
              presetsIncludingRole(row.role)
                .map((id) => PRESET_LABEL[id])
                .join(" · ") || "Solo si la agregas",
          },
          {
            key: "screens",
            header: "Pantallas del puesto",
            render: (row) => screensForRole(row.role).slice(0, 4).join(", ") || "—",
          },
          {
            key: "enabled",
            header: "Estado",
            render: (row) => (row.enabled ? "Activa" : "Oculta"),
          },
        ]}
        data={areas}
        rowKey={(row) => row.id}
        actions={[
          {
            label: "Activar o desactivar",
            variant: "edit",
            onClick: (row) => toggleArea(row.id, !row.enabled),
          },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Si falta un área, agrégala. Después crea o adapta el puesto en{" "}
          <Link href="/profiles" className="underline">
            Puestos
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
        >
          Agregar área
        </button>
      </div>

      <ModalForm
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva área"
        fields={[
          { name: "name", label: "Nombre del área", type: "text", required: true },
          {
            name: "role",
            label: "Puesto asociado",
            type: "select",
            required: true,
            options: RACI_ROLES.filter((role) => role !== "owner").map((role) => ({
              value: role,
              label: ROLE_LABELS[role],
            })),
          },
          { name: "description", label: "Descripción", type: "textarea" },
        ]}
        onSubmit={(values) => {
          addArea(values.name, values.role as UserRole, values.description || "Área personalizada");
          setOpen(false);
        }}
      />
    </div>
  );
}
