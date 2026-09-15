"use client";

import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { ModalForm } from "@/components/forms/ModalForm";
import { useOrg } from "@/components/layout/OrgProvider";
import { formatClp, formatUf, formatUsd } from "@/lib/evm";
import type { Project } from "@/lib/types";

export function PmBudgetReviewView() {
  const { visibleProjects, acceptBudget, counterBudget, canOperate } = useOrg();
  const [counter, setCounter] = useState<Project | null>(null);
  const queue = visibleProjects.filter(
    (item) => item.status === "budget_proposed" || item.status === "budget_counter",
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Revisa la cifra antes de enviarla</p>
        <h1 className="text-2xl font-semibold">Revisar presupuesto</h1>
        <p className="text-sm text-slate-600">
          Puedes aceptar lo que cargó Finanzas o mandar otra cifra. El cierre lo da el administrador
          (Comercial puede firmar junto con él).
        </p>
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Proyecto", accessor: "name" },
          {
            key: "proposed",
            header: "Propuesta Finanzas",
            render: (row) => (row.proposedBac ? formatClp(row.proposedBac) : "—"),
          },
          {
            key: "eq",
            header: "Eq. UF / USD",
            render: (row) =>
              row.proposedBac
                ? `${formatUf(row.proposedBac, row.ufClp)} · ${formatUsd(row.proposedBac, row.usdClp)}`
                : "—",
          },
          {
            key: "counter",
            header: "Su contrapropuesta",
            render: (row) => (row.counterBac ? formatClp(row.counterBac) : "—"),
          },
        ]}
        data={queue}
        rowKey={(row) => row.id}
        actions={
          canOperate("budget:counter")
            ? [
                {
                  label: "Aceptar y enviar a visto bueno",
                  variant: "view" as const,
                  onClick: (row) => acceptBudget(row.id),
                },
                {
                  label: "Contrapropuesta",
                  variant: "edit" as const,
                  onClick: (row) => setCounter(row),
                },
              ]
            : []
        }
      />

      <ModalForm
        open={Boolean(counter)}
        onClose={() => setCounter(null)}
        title="Contrapropuesta de presupuesto"
        submitLabel="Enviar a Finanzas"
        fields={[
          {
            name: "amount",
            label: "Monto que propones (CLP)",
            type: "number",
            required: true,
            defaultValue: String(counter?.proposedBac ?? ""),
          },
          {
            name: "note",
            label: "Fundamento",
            type: "textarea",
            required: true,
            placeholder: "Ajuste de partidas, recubrimiento, riesgo…",
          },
        ]}
        onSubmit={(values) => {
          if (!counter) return;
          counterBudget(counter.id, Number(values.amount), values.note);
          setCounter(null);
        }}
      />
    </div>
  );
}
