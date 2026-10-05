import type { ReactElement } from "react";
import { CopperButton, JobShell } from "@/components/jobs/job-shell";
import type { JobRecord } from "@/lib/jobs/types";
import { apiRetrySearch } from "@/lib/jobs/client";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn } from "@/lib/utils";
import { JOB_CLOSED_MESSAGE } from "@/lib/chat-expired";
import { HeaderMenu } from "../job-flow/header-menu";
import type { JobFlowCtx } from "./use-job-flow-controller";

/**
 * EXPIRED: pure history, no action buttons. PRO: the request's timer elapsed,
 * the screen auto-closes to the Dashboard (see useNegStatus).
 */
export function renderExpiredStage(
  c: JobFlowCtx,
  job: JobRecord,
): ReactElement {
  const {
    viewer,
    isLight,
    ink,
    muted,
    router,
    retryingSearch,
    setRetryingSearch,
    setErr,
    commitJob,
    load,
  } = c;
  if (viewer === "repair_pro") {
    return (
      <JobShell isLight={isLight} title="Job closed" compactHeader>
        <p className={cn("px-0.5 pt-4 text-[14px] font-medium", ink)}>
          {JOB_CLOSED_MESSAGE}
        </p>
        <p className={cn("mt-2 text-[12px]", muted)}>Opening dashboard…</p>
      </JobShell>
    );
  }

  const tradeLabel =
    PRO_SERVICE_LABELS[job.serviceType as keyof typeof PRO_SERVICE_LABELS] ||
    "Repair Pro";
  const isRerouteExhausted = job.statusHistory.some(
    (h) => h.by === "reroute_exhausted" || h.by === "pairing_exhausted",
  );
  const retriesUsed = job.statusHistory.filter(
    (h) => h.by === "retry_search",
  ).length;
  const retriesLeft = Math.max(0, 3 - retriesUsed);
  const gaveUp = isRerouteExhausted && retriesLeft <= 0;

  const onRetry = async () => {
    if (retryingSearch || retriesLeft <= 0) return;
    setRetryingSearch(true);
    setErr(null);
    try {
      const { playAppSound } = await import("@/lib/sound-tone");
      playAppSound("request_new");
    } catch {
      /* */
    }
    // Stay on the same job shell no navigation. Server restarts pairing and
    // dispatches the first of up to 6 pros in the customer radius immediately.
    const res = await apiRetrySearch(job.id);
    if (res.ok && res.data.job) {
      commitJob(res.data.job, true);
      setErr(null);
      // Immediate second fetch so pairing_deadline / waiting_for_pro paint without lag
      window.setTimeout(() => {
        void load();
      }, 200);
    } else if (!res.ok) {
      setErr(res.message || "Could not retry search");
    }
    setRetryingSearch(false);
  };

  return (
    <JobShell
      isLight={isLight}
      title={
        isRerouteExhausted
          ? `No ${tradeLabel} available`
          : "Negotiation expired"
      }
      compactHeader
      rightSlot={<HeaderMenu isLight={isLight} />}
      footer={
        !isRerouteExhausted ? undefined : (
          <div className="space-y-2">
            {gaveUp ? (
              <CopperButton onClick={() => router.replace("/")}>
                Back to Dashboard
              </CopperButton>
            ) : (
              <CopperButton
                onClick={onRetry}
                disabled={retryingSearch || retriesLeft <= 0}
              >
                {retryingSearch ? "Searching…" : "Retry search"}
              </CopperButton>
            )}
          </div>
        )
      }
    >
      <p
        className={cn(
          "px-0.5 pt-4 text-[14px] font-medium leading-relaxed",
          ink,
        )}
      >
        {isRerouteExhausted
          ? gaveUp
            ? `No ${tradeLabel} found at this time. Request other help or try again later.`
            : "No Pro Available, retry search"
          : `No agreement was reached with ${job.repairProName}.`}
      </p>
    </JobShell>
  );
}
