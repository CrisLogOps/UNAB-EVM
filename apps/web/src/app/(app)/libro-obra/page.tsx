"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { WorkBookView } from "@/components/views/WorkBookView";

export default function WorkBookPage() {
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
      <WorkBookView />
    </RoleGate>
  );
}
