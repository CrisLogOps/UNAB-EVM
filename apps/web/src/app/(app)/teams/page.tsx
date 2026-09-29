"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { CollaborativeOnly } from "@/components/auth/CollaborativeOnly";
import { ProjectStaffView } from "@/components/views/ProjectStaffView";

export default function TeamsPage() {
  return (
    <RoleGate allow={["owner"]} permission="project:staff">
      <CollaborativeOnly>
        <ProjectStaffView />
      </CollaborativeOnly>
    </RoleGate>
  );
}
