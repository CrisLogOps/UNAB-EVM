"use client";

import type { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SetupGate } from "@/components/onboarding/SetupGate";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SetupGate>
      <AppLayout>{children}</AppLayout>
    </SetupGate>
  );
}
