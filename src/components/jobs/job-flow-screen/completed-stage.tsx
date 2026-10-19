import type { ReactElement } from "react";
import { CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { CountdownTimer } from "@/components/jobs/countdown-timer";
import {
  COMPLETED_AUTO_RELEASE_WINDOW_MS,
  satisfiedReleaseEndsAtIso,
} from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
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

  const proName = (job.repairProName || "").trim() || "Your Repair Pro";
  const proFirst = proName.split(/\s+/)[0];
  const proPhotoSrc = job.repairProPhoto || undefined;

  return (
    <>
      <OnaScreen
        onBack={goJobsList}
        footer={
          <CompletedFooter
            showSatisfiedCta={showSatisfiedCta}
            payoutDone={payoutDone}
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
        <div className="space-y-4 pt-3">
          <OnaTitle
            title={
              showSatisfiedCta
                ? "Everything sorted?"
                : payoutDone
                  ? "Payment released"
                  : "Work complete"
            }
            subtitle={
              showSatisfiedCta
                ? `Confirm only when you're satisfied. This releases ${proFirst}'s payment from escrow.`
                : payoutDone
                  ? undefined
                  : "Awaiting customer confirm"
            }
          />
          {viewer !== "repair_pro" ? (
            <div className="flex items-center gap-3 rounded-ona-card border border-ona-border bg-ona-surface p-3">
              <Avatar className="h-10 w-10">
                {proPhotoSrc ? <AvatarImage src={proPhotoSrc} alt="" /> : null}
                <AvatarFallback className="bg-ona-field text-ona-ink">
                  {proName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ona-ink">
                  {proName}
                </p>
                <p className="truncate text-[11px] text-ona-muted">
                  {PRO_SERVICE_LABELS[job.serviceType] || "Repair Pro"}
                </p>
              </div>
              <Badge variant="matched">Matched</Badge>
            </div>
          ) : null}
          {payoutDone ? (
            <CheckCircle2
              className="mx-auto h-12 w-12 text-ona-success"
              strokeWidth={1.75}
              aria-hidden
            />
          ) : null}
          {/* Split breakdown Repair Pro only (customers never see 95/5) */}
          {viewer === "repair_pro" &&
          releaseProMajor != null &&
          releasePlatformMajor != null ? (
            <ReleaseSplitCard
              job={job}
              releaseProMajor={releaseProMajor}
              releasePlatformMajor={releasePlatformMajor}
              releaseVatMajor={releaseVatMajor}
              releaseTotalMajor={releaseTotalMajor}
            />
          ) : releaseTotalMajor != null ? (
            <ReleaseSplitCard job={job} releaseTotalMajor={releaseTotalMajor} />
          ) : null}
          {showSatisfiedCta && autoReleaseEndsAt ? (
            <div className="px-1">
              <p className="mb-1 text-center text-[11px] font-semibold text-ona-muted">
                Auto-release in
              </p>
              <CountdownTimer
                endsAt={autoReleaseEndsAt}
                totalMs={COMPLETED_AUTO_RELEASE_WINDOW_MS}
                className="text-ona-ink"
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
        </div>
      </OnaScreen>
      {completedDisputeSheet}
    </>
  );
}
