"use client";

import { SetupWizard } from "@/components/onboarding/SetupWizard";
import { useOrg } from "@/components/layout/OrgProvider";
import { SETUP_RESET_QUERY } from "@/lib/constants";
import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SetupPageInner() {
  const { hydrated, identity, setupPhase, resetOnboarding } = useOrg();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetOnce = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!identity || identity.path !== "new-org") {
      router.replace("/login");
      return;
    }
    if (searchParams.get(SETUP_RESET_QUERY) === "1" && !resetOnce.current) {
      resetOnce.current = true;
      resetOnboarding();
      router.replace("/setup");
      return;
    }
    if (setupPhase === "done") router.replace("/demo");
  }, [hydrated, identity, setupPhase, router, searchParams, resetOnboarding]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand)] text-white">
        <p className="text-sm">Cargando alta inicial…</p>
      </div>
    );
  }

  if (!identity || identity.path !== "new-org" || setupPhase === "done") return null;
  return <SetupWizard />;
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--brand)] text-white">
          <p className="text-sm">Cargando alta inicial…</p>
        </div>
      }
    >
      <SetupPageInner />
    </Suspense>
  );
}
