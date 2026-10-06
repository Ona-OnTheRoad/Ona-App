import type { ReactElement } from "react";
import { CheckCircle2 } from "lucide-react";
import { CountdownTimer } from "@/components/jobs/countdown-timer";
import { JobCard, JobShell } from "@/components/jobs/job-shell";
import {
  COMPLETED_AUTO_RELEASE_WINDOW_MS,
  satisfiedReleaseEndsAtIso,
} from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { CompletedFooter } from "./completed-footer";
import { computeReleaseAmounts } from "./release-amounts";
import {
  isEgressIpError,
  ReleaseErrorCardBanner,
} from "./release-error-banners";
import { ReleaseSplitCard } from "./release-split-card";
import { createSatisfiedHandler } from "./satisfied-release";
import { DisputeNode } from "./shared-pieces";
import type { JobFlowCtx } from "./use-job-flow-controller";

/** COMPLETED: customer must confirm to release pay. */
export function renderCompletedStage(
  c: JobFlowCtx,
  job: JobRecord,
): ReactElement {
  const {
    viewer,
    isLight,
    actorId,
    ink,
    muted,
    err,
    setErr,
    busy,
    setBusy,
    stickyReleaseErr,
    setStickyReleaseErr,
    calloutQuote,
    goJobsList,
    commitJob,
    applyJob,
    disputeOpen,
    setDisputeOpen,
    disputeReason,
    setDisputeReason,
    disputeDesc,
    setDisputeDesc,
    run,
  } = c;
  // Motorist on the job ALWAYS gets I’m Satisfied never hide behind role.
  const isMotoristOnJob =
    Boolean(actorId) && Boolean(job.motoristId) && job.motoristId === actorId;
  const isProOnlyOnJob =
    Boolean(actorId) &&
    Boolean(job.repairProId) &&
    job.repairProId === actorId &&
    !isMotoristOnJob;
  // Only treat as done when money actually released (not a false satisfiedAt stamp)
  const payoutDone = Boolean(job.releasedAt) || job.escrowStatus === "released";
  const showSatisfiedCta =
    !payoutDone &&
    (isMotoristOnJob || viewer === "motorist" || !isProOnlyOnJob);

  const motoristActor =
    (job.motoristId && job.motoristId.length > 10 ? job.motoristId : null) ||
    (actorId && actorId.length > 10 ? actorId : null) ||
    "";

  const onSatisfied = createSatisfiedHandler({
    job,
    motoristActor,
    setErr,
    setStickyReleaseErr,
    setBusy,
    commitJob,
    applyJob,
  });

  const releaseBanner = stickyReleaseErr || err;
  const copyReleaseErr = () => {
    if (!releaseBanner) return;
    void navigator.clipboard.writeText(releaseBanner).catch(() => null);
  };
  const dismissReleaseErr = () => {
    setErr(null);
    setStickyReleaseErr(null);
  };
  // Only show optional egress help when FLW message is clearly IP-related
  const showEgressHint = isEgressIpError(releaseBanner);

  const autoReleaseEndsAt = satisfiedReleaseEndsAtIso(job);

  const {
    releaseTotalMajor,
    releaseProMajor,
    releasePlatformMajor,
    releaseVatMajor,
  } = computeReleaseAmounts(job, calloutQuote);

  const completedDisputeSheet = (
    <DisputeNode
      open={disputeOpen}
      by="motorist"
      job={job}
      isLight={isLight}
      reason={disputeReason}
      setReason={setDisputeReason}
      desc={disputeDesc}
      setDesc={setDisputeDesc}
      busy={busy}
      setOpen={setDisputeOpen}
      run={run}
    />
  );

  return (
    <JobShell
      isLight={isLight}
      title={
        showSatisfiedCta ? "Release payment" : payoutDone ? "Paid" : "Completed"
      }
      compactHeader
      onBack={goJobsList}
      footer={
        <CompletedFooter
          showSatisfiedCta={showSatisfiedCta}
          payoutDone={payoutDone}
          muted={muted}
          isLight={isLight}
          busy={busy}
          motoristActor={motoristActor}
          releaseBanner={releaseBanner}
          showEgressHint={showEgressHint}
          onCopyError={copyReleaseErr}
          onDismissError={dismissReleaseErr}
          onSatisfied={onSatisfied}
          onOpenDispute={() => setDisputeOpen(true)}
        />
      }
    >
      <JobCard isLight={isLight} className="text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <p className={cn("mt-3 text-[18px] font-black", ink)}>
          {showSatisfiedCta
            ? "Release payment"
            : payoutDone
              ? "Released"
              : "Work complete"}
        </p>
        {!showSatisfiedCta ? (
          <p className={cn("mt-1 text-[13px] leading-snug", muted)}>
            {payoutDone ? "Payment released" : "Awaiting customer confirm"}
          </p>
        ) : null}
        {releaseTotalMajor != null && (
          <p className={cn("mt-4 text-[24px] font-black tabular-nums", ink)}>
            {formatMoney(releaseTotalMajor, job.currency)}
          </p>
        )}
        {/* Split breakdown Repair Pro only (customers never see 95/5) */}
        {viewer === "repair_pro" &&
        releaseProMajor != null &&
        releasePlatformMajor != null ? (
          <ReleaseSplitCard
            job={job}
            isLight={isLight}
            ink={ink}
            muted={muted}
            releaseProMajor={releaseProMajor}
            releasePlatformMajor={releasePlatformMajor}
            releaseVatMajor={releaseVatMajor}
          />
        ) : null}
        {showSatisfiedCta && autoReleaseEndsAt ? (
          <div className="mt-4 px-1">
            <p className="mb-1 text-center text-[11px] font-semibold text-black">
              Auto-release in
            </p>
            <CountdownTimer
              endsAt={autoReleaseEndsAt}
              totalMs={COMPLETED_AUTO_RELEASE_WINDOW_MS}
              className={ink}
            />
          </div>
        ) : null}
        {releaseBanner && showSatisfiedCta ? (
          <ReleaseErrorCardBanner
            message={releaseBanner}
            onCopy={copyReleaseErr}
            onDismiss={dismissReleaseErr}
          />
        ) : null}
      </JobCard>
      {completedDisputeSheet}
    </JobShell>
  );
}
