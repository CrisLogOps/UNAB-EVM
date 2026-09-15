"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { OwnerAdminView } from "@/components/views/OwnerAdminView";

export default function AdminPage() {
  return (
    <RoleGate allow={["owner"]} permission="user:manager">
      <OwnerAdminView />
    </RoleGate>
  );
}
