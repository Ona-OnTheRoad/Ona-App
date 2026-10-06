"use client";

/**
 * Jobs inbox
 * - Repair Pro (menu → Jobs): past jobs with full detail links
 * Active/incoming stay on Dashboard + job flow; multi-request still
 * surfaces via popup. Mid-trip jobs still open at /jobs/[id].
 * - Motorist: the "My jobs" inbox was removed /jobs redirects to the
 * motorist homepage; motorist requests live on /requests and /history.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProJobsPage } from "@/components/jobs-list/pro-jobs-page";
import { useApp } from "@/lib/store";

export default function JobsInboxPage() {
  const router = useRouter();
  const { theme, accountType, backendUserId } = useApp();
  const isLight = theme === "light";
  const viewer = accountType === "professional" ? "repair_pro" : "motorist";

  // The motorist "My jobs" inbox is removed a motorist landing here goes
  // straight to their homepage; the pro inbox still lives at /jobs.
  useEffect(() => {
    if (viewer === "motorist") router.replace("/");
  }, [viewer, router]);

  if (viewer === "repair_pro") {
    return <ProJobsPage isLight={isLight} backendUserId={backendUserId} />;
  }

  return null;
}
