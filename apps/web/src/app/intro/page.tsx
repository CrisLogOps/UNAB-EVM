"use client";

import { InviteIntro } from "@/components/onboarding/InviteIntro";
import { useOrg } from "@/components/layout/OrgProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IntroPage() {
  const { hydrated, setupPhase, sessionUser } = useOrg();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (setupPhase !== "done") {
      router.replace("/setup");
      return;
    }
    if (sessionUser.introSeen) router.replace("/demo");
  }, [hydrated, setupPhase, sessionUser.introSeen, router]);

  if (!hydrated || setupPhase !== "done" || sessionUser.introSeen) return null;
  return <InviteIntro />;
}
