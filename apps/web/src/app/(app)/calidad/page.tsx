"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { QualityView } from "@/components/views/QualityView";

export default function CalidadPage() {
  return (
    <RoleGate
      allow={["owner", "pmo", "admin_obra", "field", "oficina_tecnica", "subcontractor"]}
      permission="evidence:upload"
    >
      <QualityView />
    </RoleGate>
  );
}
