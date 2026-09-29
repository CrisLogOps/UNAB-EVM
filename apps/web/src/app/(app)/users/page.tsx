"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { CollaborativeOnly } from "@/components/auth/CollaborativeOnly";
import { UsersAdminView } from "@/components/views/UsersAdminView";

export default function UsersPage() {
  return (
    <RoleGate allow={["owner"]} permission="user:manager">
      <CollaborativeOnly>
        <UsersAdminView />
      </CollaborativeOnly>
    </RoleGate>
  );
}
