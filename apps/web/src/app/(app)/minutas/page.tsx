"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { MinutaView } from "@/components/views/MinutaView";

export default function MinutasPage() {
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
    >
      <MinutaView />
    </RoleGate>
  );
}
