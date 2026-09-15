"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { FinanceBudgetView } from "@/components/views/FinanceBudgetView";

export default function BudgetPage() {
  return (
    <RoleGate allow={["finance"]} permission="budget:propose">
      <FinanceBudgetView />
    </RoleGate>
  );
}
