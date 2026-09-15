"use client";

import { useState } from "react";
import { DataTable } from "@/components/data/DataTable";
import { ModalForm } from "@/components/forms/ModalForm";
import { useOrg } from "@/components/layout/OrgProvider";
import { formatClp, formatUf, formatUsd } from "@/lib/evm";
import type { Project } from "@/lib/types";

export function FinanceBudgetView() {
  const { visibleProjects, proposeBudget, canOperate } = useOrg();
  const [target, setTarget] = useState<Project | null>(null);
  const queue = visibleProjects.filter(
    (item) =>
      item.status === "awaiting_budget" ||
      item.status === "budget_counter" ||
      (item.status === "active" && !item.bac),
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Lo que cuesta la obra</p>
        <h1 className="text-2xl font-semibold">Presupuesto</h1>
        <p className="text-sm text-slate-600">
          Quien cubre esta tarea carga el monto en pesos. UF y dólar salen de la paridad del proyecto.
          El visto bueno lo da el administrador; esta pantalla no valida.
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
            key: "counter",
            header: "Contrapropuesta",
            render: (row) => (row.counterBac ? formatClp(row.counterBac) : "—"),
          },
          { key: "status", header: "Estado", accessor: "status" },
        ]}
        data={queue}
        rowKey={(row) => row.id}
        actions={
          canOperate("budget:propose")
            ? [
                {
                  label: "Cargar presupuesto",
                  variant: "edit" as const,
                  onClick: (row) => setTarget(row),
                },
              ]
            : []
        }
      />

      <ModalForm
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={target ? `Presupuesto · ${target.name}` : "Presupuesto"}
        submitLabel="Enviar al jefe de proyecto"
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
          Referencia: {formatUf(Number(target.counterBac ?? 0), target.ufClp)} ·{" "}
          {formatUsd(Number(target.counterBac ?? 0), target.usdClp)} si usa la contrapropuesta.
        </p>
      ) : null}
    </div>
  );
}
