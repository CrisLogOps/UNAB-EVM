"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { CollaborativeOnly } from "@/components/auth/CollaborativeOnly";
import { AreasAdminView } from "@/components/views/AreasAdminView";

export default function AreasPage() {
  return (
    <RoleGate allow={["owner"]} permission="tenant:settings">
      <CollaborativeOnly>
        <AreasAdminView />
      </CollaborativeOnly>
    </RoleGate>
  );
}
