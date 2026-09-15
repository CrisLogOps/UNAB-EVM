"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { UsersAdminView } from "@/components/views/UsersAdminView";

export default function UsersPage() {
  return (
    <RoleGate allow={["owner"]} permission="user:manager">
      <UsersAdminView />
    </RoleGate>
  );
}
