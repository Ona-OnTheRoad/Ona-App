import type { ReactElement } from "react";
import { Loader2 } from "lucide-react";
import { HeaderMenu } from "../job-flow/header-menu";
import { ScheduledDispatchScreen } from "../job-flow/scheduled-dispatch-screen";
import { SearchingScreen } from "../job-flow/searching-screen";
import { JobShell } from "@/components/jobs/job-shell";
import { JOB_CLOSED_MESSAGE } from "@/lib/chat-expired";
import { nearbyProsStatusLine } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn } from "@/lib/utils";
import type { JobFlowCtx } from "./use-job-flow-controller";

/** No job yet: spinner shell. */
export function renderLoadingStage(c: JobFlowCtx): ReactElement {
  const { isLight, goJobsList, err } = c;
  return (
    <JobShell
      isLight={isLight}
      title="Loading job…"
      compactHeader
      onBack={goJobsList}
    >
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
      {err && (
        <p className="text-center text-[13px] font-semibold text-red-500">
          {err}
        </p>
      )}
    </JobShell>
  );
}

/**
 * Truly finished jobs only → history. Keep completed/satisfied on live shell
 * so customer can tap I’M SATISFIED and release pay.
 */
export function renderRedirectingStage(c: JobFlowCtx): ReactElement {
  const { isLight, viewer, router, ink, muted } = c;
  return (
    <JobShell
      isLight={isLight}
      title="Job closed"
      compactHeader
      onBack={
        viewer === "repair_pro"
          ? () => router.replace("/dashboard")
          : () => router.replace("/")
      }
      rightSlot={<HeaderMenu isLight={isLight} />}
    >
      <p className={cn("px-0.5 pt-4 text-[14px] font-medium", ink)}>
        {JOB_CLOSED_MESSAGE}
      </p>
      <p className={cn("mt-2 text-[12px]", muted)}>Opening dashboard…</p>
    </JobShell>
  );
}

/**
 * SCHEDULED add-another-repair-pro (Tow): a linked second request created at
 * booking time, armed 60 min after the first pro accepts. The sweep pinged the
 * motorist to enter their current address; this panel books the trade pro.
 */
export function renderScheduledStage(
  c: JobFlowCtx,
  job: JobRecord,
): ReactElement {
  const { viewer, isLight, muted, goJobsList, setJob, setErr } = c;
  if (viewer === "repair_pro") {
    return (
      <JobShell isLight={isLight} title="Scheduled" compactHeader>
        <p
          className={cn(
            "px-0.5 pt-8 text-center text-[13px] font-medium",
            muted,
          )}
        >
          Waiting to be dispatched
        </p>
      </JobShell>
    );
  }
  return (
    <ScheduledDispatchScreen
      job={job}
      isLight={isLight}
      onBack={goJobsList}
      onDispatched={(updated) => {
        setJob(updated);
        setErr(null);
      }}
      onError={(msg) => setErr(msg)}
    />
  );
}

/** SEARCHING (pro cancelled, finding another). */
export function renderSearchingStage(
  c: JobFlowCtx,
  job: JobRecord,
): ReactElement {
  const { viewer, backendUserId, isLight, err, goJobsList, nearbyLiveCount } =
    c;
  return (
    <SearchingScreen
      job={job}
      viewer={viewer}
      backendUserId={backendUserId}
      isLight={isLight}
      err={err}
      onBack={goJobsList}
      nearbyLine={
        viewer === "motorist"
          ? nearbyProsStatusLine(
              nearbyLiveCount ?? 0,
              PRO_SERVICE_LABELS[job.serviceType] || job.serviceType,
            )
          : null
      }
    />
  );
}
