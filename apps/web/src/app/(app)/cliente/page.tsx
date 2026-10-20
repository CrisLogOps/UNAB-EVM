"use client";

import { Suspense } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { ClientPortalView } from "@/components/views/ClientPortalView";

export default function ClientePage() {
  return (
    <RoleGate
      allow={["owner", "pmo", "commercial", "finance", "admin_obra", "warehouse", "field", "oficina_tecnica"]}
      permission="schedule:view"
    >
      <Suspense fallback={<p className="text-sm text-slate-500">Abriendo la vista del cliente…</p>}>
        <ClientPortalView />
      </Suspense>
    </RoleGate>
  );
}
