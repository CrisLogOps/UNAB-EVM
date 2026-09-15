"use client";

import { useState } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { ModalForm } from "@/components/forms/ModalForm";
import { useOrg } from "@/components/layout/OrgProvider";

function CostsForm() {
  const { project, canOperate } = useOrg();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canEdit = canOperate("cost:edit");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Terreno · gasto del día</p>
        <h1 className="text-xl font-semibold">Gastos</h1>
        <p className="mt-1 text-sm break-words text-slate-600">
          {project.name}. Carga el gasto de la jornada. Puede adjuntar foto de boleta o guía.
        </p>
      </div>
      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">{message}</p>
      ) : null}
      <button
        type="button"
        disabled={!canEdit}
        className="min-h-14 w-full rounded-xl bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] disabled:opacity-40"
        onClick={() => setOpen(true)}
      >
        {canEdit ? "Anotar gasto" : "Solo consulta"}
      </button>
      <ModalForm
        open={open}
        onClose={() => setOpen(false)}
        title="Gasto del día"
        requireEvidence
        submitLabel="Guardar"
        fields={[
          { name: "ac", label: "Monto (CLP)", type: "number", required: true },
          { name: "note", label: "Glosa", type: "text", placeholder: "Combustible / arriendo / jornal" },
        ]}
        onSubmit={(values, file) => {
          setOpen(false);
          setMessage(`Gasto ${values.ac} registrado. Respaldo: ${file?.name ?? "sin archivo"}.`);
        }}
      />
    </div>
  );
}

export default function CostsPage() {
  return (
    <RoleGate allow={["field", "admin_obra"]} permission="cost:edit">
      <CostsForm />
    </RoleGate>
  );
}
