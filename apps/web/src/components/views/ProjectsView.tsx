"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data/DataTable";
import { useOrg } from "@/components/layout/OrgProvider";
import { formatClp } from "@/lib/evm";
import { KICKOFF_PHASE_LABEL, PROJECT_STATUS_LABEL, clientLabel } from "@/lib/kickoff";

export function ProjectsView() {
  const { visibleProjects, setProjectId, teamForProject, assignments, sessionUser, canOperate, clients } =
    useOrg();
  const router = useRouter();
  const canEdit = canOperate("project:manager");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Las obras que te tocan</p>
          <h1 className="text-2xl font-semibold">Obras</h1>
          <p className="text-sm text-slate-600">
            Crea obras desde <strong>Clientes</strong>: cada proyecto nace con kickoff interno y kickoff
            con el cliente. Finanzas carga el presupuesto después.
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => router.push("/clients")}
            className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
          >
            Nuevo proyecto
          </button>
        ) : null}
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Nombre", accessor: "name" },
          {
            key: "client",
            header: "Cliente",
            render: (row) => clientLabel(clients.find((item) => item.id === row.clientId)),
          },
          { key: "code", header: "Código", accessor: "code" },
          {
            key: "bac",
            header: "Presupuesto",
            render: (row) => (row.bac ? formatClp(row.bac) : "Sin validar"),
          },
          {
            key: "status",
            header: "Estado",
            render: (row) => PROJECT_STATUS_LABEL[row.status],
          },
          {
            key: "kickoff",
            header: "Kickoff",
            render: (row) => KICKOFF_PHASE_LABEL[row.kickoffPhase],
          },
          {
            key: "scope",
            header: "Mi alcance",
            render: (row) =>
              assignments.find((item) => item.projectId === row.id && item.userId === sessionUser.id)
                ?.note ?? "Gestor de proyectos",
          },
          {
            key: "team",
            header: "Equipo",
            render: (row) => String(teamForProject(row.id).length),
          },
        ]}
        data={visibleProjects}
        rowKey={(row) => row.id}
        filterFn={(row, q) => `${row.name} ${row.code}`.toLowerCase().includes(q)}
        actions={[
          {
            label: "Abrir",
            variant: "view",
            onClick: (row) => {
              setProjectId(row.id);
              router.push(row.kickoffPhase === "client_done" ? "/gantt" : "/clients");
            },
          },
        ]}
      />
    </div>
  );
}
