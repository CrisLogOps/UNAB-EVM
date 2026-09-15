"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { ProfilesAdminView } from "@/components/views/ProfilesAdminView";

export default function ProfilesPage() {
  return (
    <RoleGate allow={["owner"]} permission="user:manager">
      <ProfilesAdminView />
    </RoleGate>
  );
}
