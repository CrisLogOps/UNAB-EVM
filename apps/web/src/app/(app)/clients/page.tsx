"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { ClientsView } from "@/components/views/ClientsView";

export default function ClientsPage() {
  return (
    <RoleGate
      allow={["owner", "pmo", "commercial", "finance", "admin_obra", "warehouse", "field", "oficina_tecnica"]}
      permission="schedule:view"
    >
      <ClientsView />
    </RoleGate>
  );
}
