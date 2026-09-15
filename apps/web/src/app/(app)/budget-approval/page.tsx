"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { BudgetApprovalView } from "@/components/views/BudgetApprovalView";

export default function BudgetApprovalPage() {
  return (
    <RoleGate allow={["owner", "commercial"]} permission="budget:approve">
      <BudgetApprovalView />
    </RoleGate>
  );
}
