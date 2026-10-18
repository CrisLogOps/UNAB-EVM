"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOrg } from "@/components/layout/OrgProvider";

export function SetupGate({ children }: { children: ReactNode }) {
  const { hydrated, identity, setupPhase, sessionUser } = useOrg();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!identity || identity.path === "undecided") {
      if (pathname !== "/login") router.replace("/login");
      return;
    }
    if (setupPhase !== "done") {
      if (identity.path === "new-org") {
        if (pathname !== "/setup") router.replace("/setup");
        return;
      }
      if (pathname !== "/login") router.replace("/login");
      return;
    }
    if (!sessionUser.introSeen && pathname !== "/intro") {
      router.replace("/intro");
    }
  }, [hydrated, identity, setupPhase, sessionUser.introSeen, pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand)] text-white">
        <p className="text-sm">Cargando OpenEVM…</p>
      </div>
    );
  }

  if (!identity || identity.path === "undecided" || setupPhase !== "done") return null;
  if (!sessionUser.introSeen) return null;
  return children;
}
