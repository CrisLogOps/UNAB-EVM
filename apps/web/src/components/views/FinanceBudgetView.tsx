"use client";

import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { ModalForm } from "@/components/forms/ModalForm";
import { BudgetHistory } from "@/components/views/BudgetHistory";
import { useOrg } from "@/components/layout/OrgProvider";
import { latestBudgetEvent } from "@/lib/budget-history";
import { formatClp, formatUf, formatUsd } from "@/lib/evm";
import { PROJECT_STATUS_LABEL } from "@/lib/kickoff";
import type { Project } from "@/lib/types";

export function FinanceBudgetView() {
  const { visibleProjects, project, budgetEvents, proposeBudget, canOperate } = useOrg();
  const [target, setTarget] = useState<Project | null>(null);
  const queue = visibleProjects.filter((item) => item.id !== "prj-pending");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Lo que cuesta la obra</p>
        <h1 className="text-2xl font-semibold">Presupuesto</h1>
        <p className="text-sm text-slate-600">
          El monto que escribiste al crear la obra es el presupuesto inicial. Confírmalo para que el gestor lo
          revise. Si él cambia la cifra, la razón queda en el historial y en Conocimiento.
        </p>
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Proyecto", accessor: "name" },
          {
            key: "fx",
            header: "Paridad",
            render: (row) => `UF ${row.ufClp.toLocaleString("es-CL")} · US$ ${row.usdClp}`,
          },
          {
            key: "inicial",
            header: "Presupuesto inicial",
            render: (row) => {
              const amount = row.proposedBac || row.bac || 0;
              return amount ? formatClp(amount) : "Sin monto";
            },
          },
          {
            key: "last",
            header: "Último registro",
            render: (row) => {
              const last = latestBudgetEvent(row, budgetEvents);
              return last ? formatClp(last.amountClp) : "—";
            },
          },
          {
            key: "status",
            header: "Estado",
            render: (row) => PROJECT_STATUS_LABEL[row.status],
          },
        ]}
        data={queue}
        rowKey={(row) => row.id}
        actions={
          canOperate("budget:propose")
            ? [
                {
                  label: "Confirmar monto",
                  variant: "edit" as const,
                  onClick: (row) => setTarget(row),
                  hidden: (row: Project) => row.bac > 0 || row.status === "pending_approval",
                },
              ]
            : []
        }
      />

      <ModalForm
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={target ? `Presupuesto · ${target.name}` : "Presupuesto"}
        submitLabel="Enviar a revisión del gestor"
        fields={[
          {
            name: "amount",
            label: "Monto (CLP)",
            type: "number",
            required: true,
            defaultValue: String(target?.counterBac ?? target?.proposedBac ?? ""),
          },
          {
            name: "note",
            label: "Glosa / supuestos",
            type: "textarea",
            placeholder: "APU, recubrimiento, leyes sociales…",
          },
        ]}
        onSubmit={(values) => {
          if (!target) return;
          proposeBudget(target.id, Number(values.amount), values.note);
          setTarget(null);
        }}
      />

      {target ? (
        <p className="text-xs text-slate-500">
          Referencia: {formatUf(Number(target.counterBac ?? target.proposedBac ?? 0), target.ufClp)} ·{" "}
          {formatUsd(Number(target.counterBac ?? target.proposedBac ?? 0), target.usdClp)}.
        </p>
      ) : null}

      {project.id !== "prj-pending" ? <BudgetHistory project={project} events={budgetEvents} /> : null}
    </div>
  );
}
