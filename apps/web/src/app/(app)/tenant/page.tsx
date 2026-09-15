"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { TenantSettingsView } from "@/components/views/TenantSettingsView";

export default function TenantPage() {
  return (
    <RoleGate allow={["owner"]} permission="tenant:settings">
      <TenantSettingsView />
    </RoleGate>
  );
}
