"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { useOrg } from "@/components/layout/OrgProvider";
import { HOME_HREF } from "@/lib/startup-flow";

export default function LoginPage() {
  const { hydrated, identity, setupPhase, sessionUser } = useOrg();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !identity || identity.path === "undecided") return;
    if (setupPhase === "done") {
      if (sessionUser.email && sessionUser.email === identity.email) {
        router.replace(sessionUser.introSeen ? HOME_HREF : "/intro");
      }
      return;
    }
    if (identity.path === "new-org") router.replace("/setup");
  }, [hydrated, identity, setupPhase, sessionUser.introSeen, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--brand)] text-white">
        <p className="text-sm">Cargando entrada…</p>
      </div>
    );
  }

  return <LoginScreen />;
}
