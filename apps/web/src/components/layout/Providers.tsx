"use client";

import type { ReactNode } from "react";
import { OrgProvider } from "@/components/layout/OrgProvider";
import { RoleProvider } from "@/components/layout/RoleProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <OrgProvider>
      <RoleProvider>{children}</RoleProvider>
    </OrgProvider>
  );
}
