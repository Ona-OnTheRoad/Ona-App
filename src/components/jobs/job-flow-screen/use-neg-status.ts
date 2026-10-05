import { useEffect, useMemo } from "react";
import type { useRouter } from "next/navigation";
import type { JobRecord } from "@/lib/jobs/types";
import { negotiationUiStatus } from "@/lib/jobs/state-machine";
import type { JobViewer } from "./types";

/**
 * Negotiation UI status + PRO exit: when this request's timer elapses / the
 * job expires (pairing deadline or negotiation timer), close this screen and
 * go to the Dashboard.
 */
export function useNegStatus(
  job: JobRecord | null,
  viewer: JobViewer,
  router: ReturnType<typeof useRouter>,
) {
  const negStatus = useMemo(() => {
    if (!job) return "waiting";
    const last = job.offers[job.offers.length - 1];
    return negotiationUiStatus({
      status: job.status,
      offerCount: job.offers.length,
      lastSide: last?.side,
      negotiateEndsAt: job.negotiateEndsAt,
    });
  }, [job]);

  // PRO: when this request's timer elapses / the job expires (pairing deadline
  // or negotiation timer), close this screen and go to the Dashboard the
  // request is closed on every surface (panel card + this tab).
  useEffect(() => {
    if (viewer !== "repair_pro" || !job) return;
    if (job.status === "expired" || negStatus === "expired") {
      router.replace("/dashboard");
    }
  }, [viewer, job, negStatus, router]);
  return negStatus;
}
