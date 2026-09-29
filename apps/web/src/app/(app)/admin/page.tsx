"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { CollaborativeOnly } from "@/components/auth/CollaborativeOnly";
import { OwnerAdminView } from "@/components/views/OwnerAdminView";

export default function AdminPage() {
  return (
    <RoleGate allow={["owner"]} permission="user:manager">
      <CollaborativeOnly>
        <OwnerAdminView />
      </CollaborativeOnly>
    </RoleGate>
  );
}
