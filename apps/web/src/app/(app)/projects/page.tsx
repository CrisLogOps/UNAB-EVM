"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { ProjectsView } from "@/components/views/ProjectsView";

export default function ProjectsPage() {
  return (
    <RoleGate allow={["pmo"]} permission="project:manager">
      <ProjectsView />
    </RoleGate>
  );
}
