"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { ModalForm } from "@/components/forms/ModalForm";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { PROJECT_STATUS_LABEL } from "@/lib/kickoff";

export function ProjectStaffView() {
  const {
    projects,
    users,
    profiles,
    areas,
    assignments,
    assignUserToProject,
    removeAssignment,
  } = useOrg();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [open, setOpen] = useState(false);

  const project = projects.find((item) => item.id === projectId) ?? projects[0];
  const teamRows = useMemo(() => {
    if (!project) return [];
    return assignments
      .filter((item) => item.projectId === project.id)
      .map((item) => {
        const user = users.find((person) => person.id === item.userId);
        const profile = profiles.find((entry) => entry.id === user?.profileId);
        const area = areas.find((entry) => entry.id === user?.areaId);
        return {
          ...item,
          name: user?.name ?? "Persona inactiva",
          email: user?.email ?? "—",
          role: user?.role,
          profileName: profile?.name ?? "—",
          areaName: area?.name ?? "—",
        };
      });
  }, [assignments, project, users, profiles, areas]);

  const countsByArea = useMemo(() => {
    const map = new Map<string, number>();
    teamRows.forEach((row) => {
      map.set(row.areaName, (map.get(row.areaName) ?? 0) + 1);
    });
    return [...map.entries()];
  }, [teamRows]);

  const availableUsers = users.filter(
    (item) =>
      item.active &&
      item.role !== "owner" &&
      !assignments.some((entry) => entry.projectId === project?.id && entry.userId === item.id),
  );

  if (!project) {
    return <p className="text-sm text-slate-600">Todavía no hay obras.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Quién trabaja en cada obra</p>
          <h1 className="text-2xl font-semibold">En la obra</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Arma el equipo con gente de la empresa. Puede haber dos jefes de proyecto en la misma obra —
            uno de licitaciones y otro de trato privado — sin inventar un puesto nuevo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!availableUsers.length}
          className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)] disabled:opacity-40"
        >
          Asignar persona
        </button>
      </div>

      <label className="block max-w-md text-sm">
        <span className="mb-1 block font-medium text-slate-700">Proyecto</span>
        <select
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
          value={project.id}
          onChange={(event) => setProjectId(event.target.value)}
        >
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {PROJECT_STATUS_LABEL[item.status]}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        {countsByArea.map(([area, count]) => (
          <span
            key={area}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900"
          >
            {area}: {count} responsable{count === 1 ? "" : "s"}
          </span>
        ))}
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Persona", accessor: "name" },
          { key: "profileName", header: "Puesto", accessor: "profileName" },
          { key: "areaName", header: "Área", accessor: "areaName" },
          { key: "note", header: "Alcance en esta obra", accessor: "note" },
        ]}
        data={teamRows}
        rowKey={(row) => row.id}
        filterPlaceholder="Buscar en el equipo…"
        filterFn={(row, q) => `${row.name} ${row.profileName} ${row.note}`.toLowerCase().includes(q)}
        actions={[
          {
            label: "Quitar del proyecto",
            variant: "delete",
            onClick: (row) => removeAssignment(row.id),
          },
        ]}
      />

      <p className="text-xs text-slate-500">
        Desde aquí solo decides quién opera cada obra. El calendario y el presupuesto los arma el jefe
        de proyecto. Cada jefe ve solo las obras donde está asignado.
      </p>

      <ModalForm
        open={open}
        onClose={() => setOpen(false)}
        title={`Asignar a ${project.name}`}
        submitLabel="Sumar al equipo"
        fields={[
          {
            name: "userId",
            label: "Persona",
            type: "select",
            required: true,
            options: availableUsers.map((item) => {
              const profile = profiles.find((entry) => entry.id === item.profileId);
              return {
                value: item.id,
                label: `${item.name} · ${profile?.name ?? ROLE_LABELS[item.role]}`,
              };
            }),
          },
          {
            name: "note",
            label: "Alcance en esta obra",
            type: "text",
            placeholder: "Ej. licitaciones públicas / trato privado",
          },
        ]}
        onSubmit={(values) => {
          assignUserToProject(project.id, values.userId, values.note || "Asignado al proyecto");
          setOpen(false);
        }}
      />
    </div>
  );
}
