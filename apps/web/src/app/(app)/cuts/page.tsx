"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import PlaceholderPage from "@/components/views/PlaceholderPage";

export default function CutsPage() {
  return (
    <RoleGate allow={["pmo"]} permission="schedule:edit">
      <PlaceholderPage
        title="Cortes"
        description="Los cortes semanales y los estados de pago se ven en Estado. Cerrar un estado guarda el valor ganado y el costo real de esa fecha."
      />
    </RoleGate>
  );
}
