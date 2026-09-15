"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { useOrg } from "@/components/layout/OrgProvider";
import {
  allowedComponentsForRole,
  defaultComponentIds,
  PLATFORM_COMPONENTS,
} from "@/lib/components-catalog";
import { ROLE_LABELS } from "@/lib/constants";
import {
  DELEGABLE_TASKS,
  autoCoverageTasks,
  coverageModeCopy,
  coverageTasksForProfile,
  assignedRoles,
  teamCoverageMode,
  reportsToName,
  escalationPathLabel,
} from "@/lib/coverage";
import type { PlatformComponentId, UserRole } from "@/lib/types";

export function ProfilesAdminView() {
  const { profiles, areas, users, addProfile, updateProfileComponents, updateProfileTasks, deleteProfile } =
    useOrg();
  const pmId = profiles.find((item) => item.role === "pmo")?.id ?? profiles[0]?.id ?? "";
  const [editingId, setEditingId] = useState(pmId);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [areaId, setAreaId] = useState(areas.find((item) => item.role === "pmo")?.id ?? areas[0]?.id ?? "");
  const [description, setDescription] = useState("");

  const enabledAreas = areas.filter((item) => item.enabled && item.role !== "owner");
  const selectedArea = areas.find((item) => item.id === areaId);
  const createRole = (selectedArea?.role ?? "pmo") as UserRole;
  const createAllowed = allowedComponentsForRole(createRole);
  const [createIds, setCreateIds] = useState<PlatformComponentId[]>(defaultComponentIds("pmo"));
  const [notice, setNotice] = useState<string | null>(null);

  const editing = profiles.find((item) => item.id === editingId) ?? profiles[0];
  const allowed = editing ? allowedComponentsForRole(editing.role) : [];
  const peopleOnProfile = users.filter((item) => item.profileId === editing?.id);
  const mode = teamCoverageMode(users);
  const modeCopy = coverageModeCopy(mode);
  const taken = assignedRoles(users);

  const rows = useMemo(
    () =>
      profiles.map((profile) => ({
        ...profile,
        areaName: areas.find((item) => item.id === profile.areaId)?.name ?? "—",
        people: users.filter((item) => item.profileId === profile.id).length,
        extraCount: coverageTasksForProfile(profile, users).length,
      })),
    [profiles, areas, users],
  );

  function toggleCreate(id: PlatformComponentId) {
    setCreateIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleEdit(id: PlatformComponentId) {
    if (!editing) return;
    const next = editing.componentIds.includes(id)
      ? editing.componentIds.filter((item) => item !== id)
      : [...editing.componentIds, id];
    updateProfileComponents(editing.id, next);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Adaptar puestos al equipo real</p>
          <h1 className="text-2xl font-semibold">Puestos</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            <strong>Para cambiar al gerente de proyectos:</strong> elige esa fila (queda marcada) y, abajo,
            marca las <em>tareas extra</em> si falta Finanzas o Terreno. Las pantallas del menú se editan
            en el mismo recuadro. El tamaño de empresa (chica / mediana / completa) se elige en{" "}
            <Link href="/areas" className="underline">
              Áreas
            </Link>
            ; eso no reemplaza estas tareas extra.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating((value) => !value);
            const role = (areas.find((item) => item.id === areaId)?.role ?? "pmo") as UserRole;
            setCreateIds(defaultComponentIds(role));
          }}
          className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
        >
          {creating ? "Cerrar" : "Nuevo puesto"}
        </button>
      </div>

      {notice ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {notice}
        </p>
      ) : null}

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        <h2 className="font-semibold">{modeCopy.title}</h2>
        <p className="mt-1">{modeCopy.text}</p>
        <p className="mt-2 text-xs text-sky-800">
          Validar presupuesto y armar la empresa no se delegan. Siempre quedan en el administrador.
        </p>
      </section>

      {creating ? (
        <form
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selectedArea || selectedArea.role === "owner") return;
            addProfile({
              name: name.trim() || `Perfil ${ROLE_LABELS[createRole]}`,
              role: createRole,
              areaId,
              description: description.trim() || `Perfil operativo ${ROLE_LABELS[createRole]}`,
              componentIds: createIds.filter((id) => createAllowed.some((item) => item.id === id)),
              extraTaskIds: [],
            });
            setName("");
            setDescription("");
            setCreating(false);
          }}
        >
          <h2 className="text-sm font-semibold">Nuevo puesto</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Nombre del puesto</span>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jefe de licitaciones públicas"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Área</span>
              <select
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                value={areaId}
                onChange={(event) => {
                  const nextArea = areas.find((item) => item.id === event.target.value);
                  setAreaId(event.target.value);
                  if (nextArea) setCreateIds(defaultComponentIds(nextArea.role));
                }}
              >
                {enabledAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} → {ROLE_LABELS[area.role]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Para qué se usa</span>
            <textarea
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Mismo puesto, distinta cartera"
            />
          </label>
          <ComponentChecklist
            title={`Pantallas de ${ROLE_LABELS[createRole]}`}
            allowedIds={createAllowed.map((item) => item.id)}
            selectedIds={createIds}
            onToggle={toggleCreate}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
            >
              Guardar puesto
            </button>
          </div>
        </form>
      ) : null}

      <DataTable
        columns={[
          { key: "name", header: "Puesto", accessor: "name" },
          {
            key: "role",
            header: "Tipo",
            render: (row) => ROLE_LABELS[row.role],
          },
          { key: "areaName", header: "Área", accessor: "areaName" },
          {
            key: "people",
            header: "Personas",
            render: (row) => String(row.people),
          },
          {
            key: "extraCount",
            header: "Tareas extra",
            render: (row) => (row.extraCount ? String(row.extraCount) : "—"),
          },
          {
            key: "mods",
            header: "Pantallas",
            render: (row) => String(row.componentIds.length),
          },
        ]}
        data={rows}
        rowKey={(row) => row.id}
        selectedKey={editing?.id}
        onRowClick={(row) => setEditingId(row.id)}
        filterPlaceholder="Buscar puesto…"
        filterFn={(row, q) => `${row.name} ${ROLE_LABELS[row.role]}`.toLowerCase().includes(q)}
        actions={[
          {
            label: "Adaptar puesto",
            variant: "edit",
            onClick: (row) => setEditingId(row.id),
          },
          {
            label: "Eliminar puesto",
            variant: "delete",
            onClick: (row) => {
              const ok = deleteProfile(row.id);
              if (!ok) {
                setNotice("El puesto de administrador no se elimina: es el que arma el resto.");
                return;
              }
              const remaining = profiles.filter((item) => item.id !== row.id);
              setEditingId(remaining[0]?.id ?? "");
              setNotice(
                `Se eliminó «${row.name}». Quienes lo tenían quedan sin puesto hasta que les asignes otro.`,
              );
            },
          },
        ]}
      />

      {editing ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">
            Adaptar «{editing.name}»
            {editing.role === "pmo" ? " · gerente de proyectos" : ""}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Puesto base: <strong>{ROLE_LABELS[editing.role]}</strong>
            {editing.role !== "owner" ? (
              <>
                . Reporta a <strong>{reportsToName(editing.role, users) || "Administrador"}</strong>
                {" · "}
                {escalationPathLabel(editing.role)}
              </>
            ) : (
              ". Tiene la última palabra en las validaciones."
            )}
            . Lo usan: {peopleOnProfile.map((item) => item.name).join(", ") || "nadie aún"}.
          </p>
          {editing.role === "pmo" ? (
            <p className="mt-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
              Aquí se cambia lo que puede hacer el gerente de proyectos. Primero las tareas extra (si
              falta gente); después las pantallas de su menú.
            </p>
          ) : null}
          {editing.role !== "owner" ? (
            <CoverageTasks
              role={editing.role}
              selectedIds={editing.extraTaskIds ?? []}
              autoIds={autoCoverageTasks(editing.role, users).map((item) => item.id)}
              activeIds={coverageTasksForProfile(editing, users).map((item) => item.id)}
              vacantRoles={
                new Set(
                  DELEGABLE_TASKS.filter((task) => !taken.has(task.vacantRole)).map(
                    (task) => task.vacantRole,
                  ),
                )
              }
              onToggle={(taskId) => {
                const current = editing.extraTaskIds ?? [];
                const next = current.includes(taskId)
                  ? current.filter((id) => id !== taskId)
                  : [...current, taskId];
                updateProfileTasks(editing.id, next);
              }}
            />
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              El administrador no recibe tareas extra: ya cubre todo hasta entregar un puesto. Las
              validaciones (visto bueno) no se delegan.
            </p>
          )}
          <div className="mt-4">
            <ComponentChecklist
              title="Pantallas de este puesto (menú)"
              allowedIds={allowed.map((item) => item.id)}
              selectedIds={editing.componentIds}
              onToggle={toggleEdit}
              locked={editing.role === "owner" ? ["dashboard", "admin", "profiles", "users", "project_staff"] : []}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CoverageTasks({
  role,
  selectedIds,
  autoIds,
  activeIds,
  vacantRoles,
  onToggle,
}: {
  role: UserRole;
  selectedIds: string[];
  autoIds: string[];
  activeIds: string[];
  vacantRoles: Set<UserRole>;
  onToggle: (taskId: string) => void;
}) {
  return (
    <fieldset className="mt-4 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
      <legend className="px-1 text-sm font-medium text-slate-800">Si falta personal · tareas extra</legend>
      <p className="mb-2 text-xs text-slate-600">
        Marca lo que este puesto cubre mientras no exista la persona dueña (Finanzas o Terreno). El visto
        bueno del administrador no se puede pasar. Si la casilla está bloqueada, o ya está cubierto por el
        tamaño del equipo, o ya hay alguien en ese puesto.
      </p>
      <div className="grid gap-2">
        {DELEGABLE_TASKS.map((task) => {
          const vacant = vacantRoles.has(task.vacantRole);
          const autoOn = autoIds.includes(task.id);
          const extraOn = selectedIds.includes(task.id);
          const active = activeIds.includes(task.id);
          const disabled = autoOn || !vacant;
          return (
            <label
              key={task.id}
              className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${
                active ? "border-[var(--accent)] bg-emerald-50" : "border-zinc-200 bg-white"
              } ${disabled && !autoOn ? "opacity-60" : ""}`}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={active}
                disabled={disabled}
                onChange={() => {
                  if (disabled) return;
                  onToggle(task.id);
                }}
              />
              <span>
                <span className="font-medium">{task.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{task.detail}</span>
                <span className="mt-0.5 block text-[11px] text-slate-400">
                  {autoOn
                    ? "Ya asignada (equipo sin ese dueño): no hay que marcarla a mano"
                    : !vacant
                      ? `Ya hay ${ROLE_LABELS[task.vacantRole]}: vuelve a este puesto si esa persona sale`
                      : extraOn
                        ? "Asignada a este puesto · quítala si ya no hace falta"
                        : `Marca para que ${ROLE_LABELS[role]} cubra a ${ROLE_LABELS[task.vacantRole]}`}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ComponentChecklist({
  title,
  allowedIds,
  selectedIds,
  onToggle,
  locked = [],
}: {
  title: string;
  allowedIds: PlatformComponentId[];
  selectedIds: PlatformComponentId[];
  onToggle: (id: PlatformComponentId) => void;
  locked?: PlatformComponentId[];
}) {
  const allowed = new Set(allowedIds);
  const items = PLATFORM_COMPONENTS.filter((item) => allowed.has(item.id));

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-700">{title}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const checked = selectedIds.includes(item.id);
          const isLocked = locked.includes(item.id);
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer gap-2 rounded-lg border px-3 py-2 text-sm ${
                checked ? "border-[var(--accent)] bg-emerald-50" : "border-zinc-200 bg-white"
              } ${isLocked ? "opacity-80" : ""}`}
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={checked}
                disabled={isLocked && checked}
                onChange={() => {
                  if (isLocked && checked) return;
                  onToggle(item.id);
                }}
              />
              <span>
                <span className="font-medium">{item.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
