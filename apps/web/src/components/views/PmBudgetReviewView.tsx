"use client";

import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { ModalForm } from "@/components/forms/ModalForm";
import { BudgetHistory } from "@/components/views/BudgetHistory";
import { useOrg } from "@/components/layout/OrgProvider";
import { formatClp, formatUf, formatUsd } from "@/lib/evm";
import type { Project } from "@/lib/types";

export function PmBudgetReviewView() {
  const { visibleProjects, project, budgetEvents, acceptBudget, counterBudget, canOperate } = useOrg();
  const [counter, setCounter] = useState<Project | null>(null);
  const queue = visibleProjects.filter(
    (item) =>
      item.id !== "prj-pending" &&
      ((item.proposedBac ?? 0) > 0 || (item.counterBac ?? 0) > 0 || item.bac > 0),
  );
  const openForReview = (item: Project) => !item.bac && item.status !== "pending_approval";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Revisa la cifra antes de enviarla</p>
        <h1 className="text-2xl font-semibold">Revisar presupuesto</h1>
        <p className="text-sm text-slate-600">
          El monto inicial es lo que el administrador cargó al crear la obra. Acéptalo o manda otra cifra
          con un archivo. Esa razón queda en el historial y en Conocimiento, para la próxima venta.
        </p>
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Proyecto", accessor: "name" },
          {
            key: "proposed",
            header: "Monto cargado",
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
                  hidden: (row: Project) => !openForReview(row),
                },
                {
                  label: "Contrapropuesta",
                  variant: "edit" as const,
                  onClick: (row) => setCounter(row),
                  hidden: (row: Project) => !openForReview(row),
                },
              ]
            : []
        }
      />

      <ModalForm
        open={Boolean(counter)}
        onClose={() => setCounter(null)}
        title="Contrapropuesta de presupuesto"
        requireEvidence
        submitLabel="Enviar al administrador"
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
            label: "Por qué cambia la cifra",
            type: "textarea",
            required: true,
            placeholder: "Qué partida cambia y por qué el monto cargado no alcanza",
          },
        ]}
        validate={(values, file) => {
          if (values.note.trim().length >= 8 && file) return null;
          return "Escribe la razón (al menos 8 caracteres) y adjunta el archivo que la sostiene.";
        }}
        onSubmit={(values, file) => {
          if (!counter || !file) return;
          counterBudget(counter.id, Number(values.amount), values.note, file.name);
          setCounter(null);
        }}
      />

      {project.id !== "prj-pending" ? <BudgetHistory project={project} events={budgetEvents} /> : null}
    </div>
  );
}
