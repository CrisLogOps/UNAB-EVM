"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { AreasAdminView } from "@/components/views/AreasAdminView";

export default function AreasPage() {
  return (
    <RoleGate allow={["owner"]} permission="tenant:settings">
      <AreasAdminView />
    </RoleGate>
  );
}
