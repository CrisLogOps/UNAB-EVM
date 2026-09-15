"use client";

import { RoleGate } from "@/components/auth/RoleGate";
import { GanttView } from "@/components/views/GanttView";

export default function GanttPage() {
  return (
    <RoleGate allow={["pmo"]} permission="schedule:edit">
      <GanttView />
    </RoleGate>
  );
}
