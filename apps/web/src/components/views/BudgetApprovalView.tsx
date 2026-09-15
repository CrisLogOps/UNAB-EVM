"use client";

import Link from "next/link";
import { DataTable } from "@/components/data/DataTable";
import { useOrg } from "@/components/layout/OrgProvider";
import { useRoleContext } from "@/components/layout/RoleProvider";
import { ROLE_LABELS } from "@/lib/constants";
import { formatClp, formatUf, formatUsd } from "@/lib/evm";
import { PROJECT_STATUS_LABEL } from "@/lib/kickoff";

export function BudgetApprovalView() {
  const { visibleProjects, approveBudget, canOperate } = useOrg();
  const { role } = useRoleContext();
  const canApproveBudget = canOperate("budget:approve");
  const queue = visibleProjects.filter((item) => item.status === "pending_approval");
  const waitingPm = visibleProjects.filter(
    (item) => item.status === "budget_proposed" || item.status === "budget_counter",
  );
  const waitingLoad = visibleProjects.filter(
    (item) =>
      !item.bac &&
      item.proposedBac == null &&
      item.status !== "pending_approval" &&
      item.status !== "budget_proposed" &&
      item.status !== "budget_counter",
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Visto bueno de {ROLE_LABELS[role]}</p>
        <h1 className="text-2xl font-semibold">Aprobar presupuesto</h1>
        <p className="text-sm text-slate-600">
          El administrador valida la cifra. Comercial puede cerrar junto con él. El gestor de proyectos
          no da este visto bueno: primero Finanzas carga el monto y el gestor lo envía a esta cola.
        </p>
      </div>

      {!canApproveBudget ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Este puesto no cierra el presupuesto. Entra como {ROLE_LABELS.owner} o {ROLE_LABELS.commercial}.
        </p>
      ) : null}

      {waitingPm.length ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">
          {waitingPm.length === 1 ? "Hay un presupuesto" : `Hay ${waitingPm.length} presupuestos`} en
          revisión del gestor. Hasta que lo acepte, no aparece aquí.{" "}
          <Link href="/budget-review" className="underline">
            Ir a revisar
          </Link>
        </p>
      ) : null}

      {waitingLoad.length && !queue.length && !waitingPm.length ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Todavía no hay un monto cargado. Finanzas lo propone en{" "}
          <Link href="/budget" className="underline">
            Presupuesto
          </Link>
          . Lo que Comercial vendió en el kickoff no es, por sí solo, el BAC a aprobar.
        </p>
      ) : null}

      <DataTable
        columns={[
          { key: "name", header: "Proyecto", accessor: "name" },
          {
            key: "fx",
            header: "UF / USD del alta",
            render: (row) => `UF ${row.ufClp.toLocaleString("es-CL")} · US$ ${row.usdClp}`,
          },
          {
            key: "fin",
            header: "Finanzas",
            render: (row) => (row.proposedBac ? formatClp(row.proposedBac) : "—"),
          },
          {
            key: "pm",
            header: "Contrapropuesta",
            render: (row) => (row.counterBac ? formatClp(row.counterBac) : "Sin contra"),
          },
          {
            key: "final",
            header: "Monto a aprobar",
            render: (row) => {
              const amount = row.counterBac ?? row.proposedBac ?? 0;
              return `${formatClp(amount)} · ${formatUf(amount, row.ufClp)} · ${formatUsd(amount, row.usdClp)}`;
            },
          },
          {
            key: "note",
            header: "Glosa",
            accessor: "budgetNote",
          },
        ]}
        data={queue}
        rowKey={(row) => row.id}
        actions={
          canApproveBudget
            ? [
                {
                  label: "Aprobar",
                  variant: "edit" as const,
                  onClick: (row) => approveBudget(row.id),
                },
              ]
            : []
        }
      />

      {waitingPm.length ? (
        <ul className="text-xs text-slate-500">
          {waitingPm.map((item) => (
            <li key={item.id}>
              {item.name}: {PROJECT_STATUS_LABEL[item.status]}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
