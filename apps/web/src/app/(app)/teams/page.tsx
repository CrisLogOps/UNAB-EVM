"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { ProjectStaffView } from "@/components/views/ProjectStaffView";

export default function TeamsPage() {
  return (
    <RoleGate allow={["owner"]} permission="project:staff">
      <ProjectStaffView />
    </RoleGate>
  );
}
