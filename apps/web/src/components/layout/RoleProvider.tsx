"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Project, Tenant, UserRole } from "@/lib/types";
import { useOrg } from "./OrgProvider";

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  tenant: Tenant;
  project: Project;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { role, users, setSessionUserId, project, tenant } = useOrg();
  const value = useMemo(
    () => ({
      role,
      setRole(next: UserRole) {
        const match = users.find((item) => item.role === next && item.active);
        if (match) setSessionUserId(match.id);
      },
      tenant,
      project,
    }),
    [role, users, setSessionUserId, project, tenant],
  );
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRoleContext() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRoleContext debe usarse dentro de RoleProvider");
  return ctx;
}
