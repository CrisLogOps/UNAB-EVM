"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { PmBudgetReviewView } from "@/components/views/PmBudgetReviewView";

export default function BudgetReviewPage() {
  return (
    <RoleGate allow={["pmo"]} permission="budget:counter">
      <PmBudgetReviewView />
    </RoleGate>
  );
}
