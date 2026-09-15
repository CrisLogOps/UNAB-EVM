"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import PlaceholderPage from "@/components/views/PlaceholderPage";

export default function FinancePage() {
  return (
    <RoleGate allow={["finance"]} permission="budget:propose">
      <PlaceholderPage
        title="Pagos"
        description="Estados de pago y retenciones quedan para una etapa siguiente."
      />
    </RoleGate>
  );
}
