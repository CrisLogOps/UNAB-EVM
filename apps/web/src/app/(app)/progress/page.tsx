"use client";

import { Suspense } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { ProgressView } from "@/components/views/ProgressView";

export default function ProgressPage() {
  return (
    <RoleGate
      allow={[
        "owner",
        "pmo",
        "field",
        "subcontractor",
        "finance",
        "commercial",
        "warehouse",
        "admin_obra",
        "oficina_tecnica",
      ]}
      permission="evidence:upload"
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando avance…</p>}>
        <ProgressView />
      </Suspense>
    </RoleGate>
  );
}
