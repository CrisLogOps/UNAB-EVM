"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { CollaborativeOnly } from "@/components/auth/CollaborativeOnly";
import { ProfilesAdminView } from "@/components/views/ProfilesAdminView";

export default function ProfilesPage() {
  return (
    <RoleGate allow={["owner"]} permission="user:manager">
      <CollaborativeOnly>
        <ProfilesAdminView />
      </CollaborativeOnly>
    </RoleGate>
  );
}
