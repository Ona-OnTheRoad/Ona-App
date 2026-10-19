import type { ReactElement } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import {
  CopperButton,
  GhostButton,
  JobCard,
  JobShell,
} from "@/components/jobs/job-shell";
import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import { jobEscrowAmountMinor } from "@/lib/callout/payable";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { ChatEndedDialog } from "./shared-pieces";
import type { JobFlowCtx } from "./use-job-flow-controller";

/** PENDING SETTLEMENT (pro view only, customer goes to review first). */
export function renderPendingSettlementStage(
  c: JobFlowCtx,
  job: JobRecord,
): ReactElement {
  const { isLight, router, ink, muted, calloutQuote } = c;
  return (
    <JobShell
      isLight={isLight}
      title="Payout processing"
      compactHeader
      onBack={() => router.replace("/dashboard")}
      footer={
        <button
          type="button"
          onClick={() => router.replace("/dashboard")}
          className="inline-flex h-12 w-full items-center justify-center rounded-md border-0 bg-[#FF6B35] text-[14px] font-black text-white"
        >
          Dashboard
        </button>
      }
    >
      <JobCard isLight={isLight} className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#FF6B35]" />
        <p className={cn("mt-3 text-[17px] font-black", ink)}>
          Payout processing
        </p>
        <p className={cn("mt-2 text-[13px] leading-snug", muted)}>
          Your payout is being processed automatically. You’ll be notified when
          it’s released to your bank.
        </p>
        {job.agreedMajor != null ? (
          <div className="mt-4 w-full text-left">
            <JobChargeLines
              agreedMajor={job.agreedMajor}
              amountMinor={jobEscrowAmountMinor(job)}
              quote={calloutQuote ?? job.calloutQuote}
              fallbackQuote={job.calloutQuote}
              currency={job.currency}
              ink={ink}
              muted={muted}
              isLight={isLight}
            />
          </div>
        ) : null}
      </JobCard>
    </JobShell>
  );
}

/** DISPUTED / APPEAL. */
export function renderDisputedStage(
  c: JobFlowCtx,
  job: JobRecord,
): ReactElement {
  const {
    isLight,
    goJobsList,
    muted,
    ink,
    openJobChat,
    chatGateOpen,
    setChatGateOpen,
    setChatGateViewHref,
  } = c;
  return (
    <JobShell
      isLight={isLight}
      title={job.status === "under_appeal" ? "Under appeal" : "Dispute active"}
      compactHeader
      onBack={goJobsList}
    >
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[#FF6B35]/150/15 px-3 py-3 text-[#FF6B35] dark:text-[#FF6B35]">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <p className="text-[13px] font-bold">
          Admin review in progress. Chat remains open. You may add evidence.
        </p>
      </div>
      <JobCard isLight={isLight}>
        <p className={cn("text-[12px] font-bold uppercase", muted)}>Reason</p>
        <p className={cn("mt-1 text-[14px] font-semibold", ink)}>
          {job.dispute?.reason}
        </p>
        <p className={cn("mt-2 text-[13px]", muted)}>
          {job.dispute?.description}
        </p>
        {job.evidence && (
          <div className="mt-3 rounded-xl bg-black/5 p-3 dark:bg-white/5">
            <p className={cn("text-[12px] font-bold", ink)}>
              Evidence score: {job.evidence.composite}/100 ·{" "}
              {job.evidence.priority}
            </p>
            <p className={cn("mt-1 text-[11px]", muted)}>
              Photo {job.evidence.photoScore} · Voice {job.evidence.voiceScore}{" "}
              · Location {job.evidence.locationScore} · Time{" "}
              {job.evidence.timestampScore}
            </p>
          </div>
        )}
      </JobCard>
      <GhostButton
        isLight={isLight}
        className="mt-3"
        onClick={() => void openJobChat(job)}
      >
        Open chat
      </GhostButton>
      <div className="relative min-h-0">
        <ChatEndedDialog
          open={chatGateOpen}
          isLight={isLight}
          setChatGateOpen={setChatGateOpen}
          setChatGateViewHref={setChatGateViewHref}
        />
      </div>
    </JobShell>
  );
}

/** CANCELLED / REFUNDED. */
export function renderCancelledStage(
  c: JobFlowCtx,
  job: JobRecord,
): ReactElement {
  const { isLight, viewer, goJobsList, router, muted } = c;
  return (
    <JobShell
      isLight={isLight}
      title={
        job.status === "refunded"
          ? "Refunded"
          : job.status === "cancelled"
            ? "Cancelled"
            : job.status
      }
      compactHeader
      onBack={goJobsList}
      footer={
        viewer === "repair_pro" ? (
          <div className="space-y-2">
            <GhostButton
              isLight={isLight}
              onClick={() => router.push("/dashboard")}
            >
              Home
            </GhostButton>
          </div>
        ) : (
          <div className="space-y-2">
            <CopperButton onClick={() => router.push("/")}>
              Request again
            </CopperButton>
            <GhostButton isLight={isLight} onClick={() => router.push("/")}>
              Choose another pro
            </GhostButton>
          </div>
        )
      }
    >
      <JobCard isLight={isLight}>
        <p className={cn("text-[14px] font-medium", muted)}>
          {job.status === "cancelled" || job.status === "refunded"
            ? job.escrowStatus === "refunded" || job.status === "refunded"
              ? "This job was cancelled. The full amount was refunded to the customer. Booked jobs must be completed within 6 hours of payment."
              : "This job was cancelled. If escrow was held, the full amount returns to the customer."
            : "This job has ended."}
        </p>
      </JobCard>
    </JobShell>
  );
}
