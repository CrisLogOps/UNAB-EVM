"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import PlaceholderPage from "@/components/views/PlaceholderPage";

export default function CutsPage() {
  return (
    <RoleGate allow={["pmo"]} permission="schedule:edit">
      <PlaceholderPage
        title="Cortes"
        description="El jefe de proyecto da el visto bueno a cada corte. El semáforo se ve en Estado."
      />
    </RoleGate>
  );
}
