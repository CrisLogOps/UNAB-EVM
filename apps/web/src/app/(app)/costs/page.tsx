"use client";

import { useState } from "react";
import Link from "next/link";
import { RoleGate } from "@/components/auth/RoleGate";
import { ModalForm } from "@/components/forms/ModalForm";
import { useOrg } from "@/components/layout/OrgProvider";
import { formatClp } from "@/lib/evm";
import { minuteTotals } from "@/lib/minutes";

function CostsForm() {
  const { project, canOperate, addMinute, minutes, sessionUser } = useOrg();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canEdit = canOperate("cost:edit");
  const totals = minuteTotals(minutes, project.id);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Costo real de la obra</p>
        <h1 className="text-xl font-semibold">Gastos</h1>
        <p className="mt-1 text-sm break-words text-slate-600">
          {project.name}. Cada gasto queda en una minuta y suma al costo real (AC). Los adicionales por cobrar se
          anotan en{" "}
          <Link href="/minutas" className="underline">
            Minutas
          </Link>{" "}
          y no se absorben en el CPI. Gastos registrados: {formatClp(totals.gasto)}.
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
          const amount = Number(values.ac);
          const note = values.note?.trim() || "Gasto de la obra";
          const ok = addMinute({
            origin: "interno",
            issuer: sessionUser.name,
            body: note.length >= 8 ? note : `${note}. Gasto del día de la obra.`,
            costEffect: "gasto",
            amountClp: amount,
            evidenceFileName: file?.name,
          });
          setOpen(false);
          setMessage(
            ok
              ? `Gasto ${formatClp(amount)} anotado en minutas. Respaldo: ${file?.name ?? "sin archivo"}.`
              : "No se pudo anotar el gasto. Indica el monto y una glosa.",
          );
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
