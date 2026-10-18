"use client";

import { InviteIntro } from "@/components/onboarding/InviteIntro";
import { useOrg } from "@/components/layout/OrgProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IntroPage() {
  const { hydrated, identity, setupPhase, sessionUser } = useOrg();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!identity || identity.path === "undecided") {
      router.replace("/login");
      return;
    }
    if (setupPhase !== "done") {
      router.replace(identity.path === "new-org" ? "/setup" : "/login");
      return;
    }
    if (sessionUser.introSeen) router.replace("/demo");
  }, [hydrated, identity, setupPhase, sessionUser.introSeen, router]);

  if (!hydrated || !identity || setupPhase !== "done" || sessionUser.introSeen) return null;
  return <InviteIntro />;
}
