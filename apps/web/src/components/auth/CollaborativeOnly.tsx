"use client";

import type { ReactNode } from "react";
import { OperatingModeSwitch } from "@/components/layout/OperatingModeSwitch";
import { useOrg } from "@/components/layout/OrgProvider";
import { isIndividualMode } from "@/lib/operating-mode";

export function CollaborativeOnly({ children }: { children: ReactNode }) {
  const { tenant } = useOrg();
  if (!isIndividualMode(tenant)) return children;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h1 className="text-lg font-semibold text-amber-950">Vista de modo colaborativo</h1>
        <p className="mt-2 text-sm text-amber-900">
          En modo individual no se administran usuarios, puestos ni áreas. Pasa a colaborativo (2 o más
          personas) para abrir estas pantallas. El flujo de la obra se mantiene.
        </p>
      </div>
      <OperatingModeSwitch variant="panel" />
    </div>
  );
}
