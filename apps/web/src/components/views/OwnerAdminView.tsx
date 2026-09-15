"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Users, IdCard, UserPlus, LayoutDashboard, Building2 } from "lucide-react";
import { DataTable } from "@/components/data/DataTable";
import { useOrg } from "@/components/layout/OrgProvider";
import { ROLE_LABELS, SETUP_RESET_QUERY } from "@/lib/constants";
import { coverageModeCopy, teamCoverageMode } from "@/lib/coverage";
import { TrainingScheduleHints } from "@/components/onboarding/TrainingScheduleHints";
import { StartupChecklist } from "@/components/onboarding/StartupChecklist";
import { formatClp } from "@/lib/evm";

import { PROJECT_STATUS_LABEL } from "@/lib/kickoff";

export function OwnerAdminView() {
  const {
    users,
    projects,
    assignments,
    teamForProject,
    resetOnboarding,
    tenant,
    project,
    handedRoles,
  } = useOrg();
  const router = useRouter();
  const pending = projects.filter((item) => item.status === "pending_approval");
  const coverageCopy = coverageModeCopy(teamCoverageMode(users));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{tenant.name || "Tu empresa"}</p>
        <h1 className="text-2xl font-semibold">Administración</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Personas, puestos y obras. El arranque del proyecto (cliente, kickoff, presupuesto, calendario)
          está en <Link href="/demo" className="underline">Inicio</Link>.
        </p>
      </div>

      <StartupChecklist compact />

      <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        <h2 className="font-semibold">{coverageCopy.title}</h2>
        <p className="mt-1">{coverageCopy.text}</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/clients" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-[var(--accent)]">
          <Building2 className="h-5 w-5 text-[var(--accent)]" />
          <p className="mt-2 font-semibold">Clientes</p>
          <p className="text-sm text-slate-600">Razón social, RUT, proyectos y kickoff.</p>
        </Link>
        <Link href="/users" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-[var(--accent)]">
          <Users className="h-5 w-5 text-[var(--accent)]" />
          <p className="mt-2 font-semibold">Personas</p>
          <p className="text-sm text-slate-600">{users.length} en la empresa</p>
        </Link>
        <Link href="/profiles" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-[var(--accent)]">
          <IdCard className="h-5 w-5 text-[var(--accent)]" />
          <p className="mt-2 font-semibold">Puestos</p>
          <p className="text-sm text-slate-600">
            Adaptar al gerente de proyectos: tareas extra si falta Finanzas o Terreno.
          </p>
        </Link>
        <Link href="/areas" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-[var(--accent)]">
          <Building2 className="h-5 w-5 text-[var(--accent)]" />
          <p className="mt-2 font-semibold">Áreas</p>
          <p className="text-sm text-slate-600">
            Paquetes Empresa chica, mediana o completa: qué puestos se encienden.
          </p>
        </Link>
        <Link href="/teams" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-[var(--accent)]">
          <UserPlus className="h-5 w-5 text-[var(--accent)]" />
          <p className="mt-2 font-semibold">En la obra</p>
          <p className="text-sm text-slate-600">{assignments.length} asignaciones</p>
        </Link>
        <Link href="/demo" className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-[var(--accent)]">
          <LayoutDashboard className="h-5 w-5 text-[var(--accent)]" />
          <p className="mt-2 font-semibold">Inicio</p>
          <p className="text-sm text-slate-600">Datos que faltan y control de la obra</p>
        </Link>
      </div>

      {project.id !== "prj-pending" && project.startDate ? (
        <TrainingScheduleHints startDate={project.startDate} finishDate={project.finishDate} />
      ) : null}

      {handedRoles.length ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          Ya entregaste: {handedRoles.map((item) => ROLE_LABELS[item]).join(", ")}. Esas partes las ves,
          no las editas.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          El menú muestra todas las opciones. Si no hay más personal, sigue con presupuesto y calendario.
        </p>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm("Se borra el alta de este navegador y vuelves al paso 1.")) return;
            resetOnboarding();
            router.push(`/setup?${SETUP_RESET_QUERY}=1`);
          }}
          className="rounded-md border border-zinc-200 px-3 py-2 text-sm hover:border-[var(--accent)]"
        >
          Empezar de cero
        </button>
      </div>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <Eye className="h-4 w-4 text-[var(--brand)]" />
          <h2 className="text-sm font-semibold">Obras</h2>
        </div>
        <DataTable
          columns={[
            { key: "name", header: "Obra", accessor: "name" },
            { key: "code", header: "Código", accessor: "code" },
            {
              key: "bac",
              header: "Presupuesto",
              render: (row) => (row.bac ? formatClp(row.bac) : "—"),
            },
            {
              key: "status",
              header: "Estado",
              render: (row) => PROJECT_STATUS_LABEL[row.status],
            },
            {
              key: "pms",
              header: "Gestor de proyectos",
              render: (row) => {
                const pms = teamForProject(row.id).filter((item) => item.role === "pmo");
                return pms.length ? pms.map((item) => item.name).join(", ") : "Sin asignar";
              },
            },
            {
              key: "team",
              header: "Equipo",
              render: (row) => String(teamForProject(row.id).length),
            },
          ]}
          data={projects}
          rowKey={(row) => row.id}
        />
      </section>

      {pending.length ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Presupuestos esperando tu visto bueno</h2>
          <DataTable
            columns={[
              { key: "name", header: "Obra", accessor: "name" },
              { key: "code", header: "Código", accessor: "code" },
              { key: "status", header: "Estado", accessor: "status" },
            ]}
            data={pending}
            rowKey={(row) => row.id}
          />
          <p className="mt-2 text-xs text-slate-500">
            Se aprueban en{" "}
            <Link href="/budget-approval" className="underline">
              Aprobar $
            </Link>
            . El jefe de proyecto no da el cierre.
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-semibold">Quién está en la empresa</h2>
        <DataTable
          columns={[
            { key: "name", header: "Nombre", accessor: "name" },
            { key: "email", header: "Correo", accessor: "email" },
            {
              key: "role",
              header: "Puesto",
              render: (row) => ROLE_LABELS[row.role],
            },
          ]}
          data={users}
          rowKey={(row) => row.id}
          filterFn={(row, q) =>
            row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q)
          }
        />
      </section>
    </div>
  );
}
