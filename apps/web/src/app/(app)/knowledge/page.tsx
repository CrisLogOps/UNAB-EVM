"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { KnowledgeView } from "@/components/views/KnowledgeView";

export default function KnowledgePage() {
  return (
    <RoleGate
      allow={["owner", "pmo", "commercial", "finance", "admin_obra", "warehouse", "field", "oficina_tecnica"]}
      permission="schedule:view"
    >
      <KnowledgeView />
    </RoleGate>
  );
}
