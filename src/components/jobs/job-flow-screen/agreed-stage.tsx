import type { ReactElement } from "react";
import { JobShell } from "@/components/jobs/job-shell";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { AgreedFooter } from "./agreed-footer";
import { AgreedPartyRow } from "./agreed-party-row";
import { AgreedPriceCard } from "./agreed-price-card";
import { PayCancelDialog } from "./pay-cancel-dialog";
import { CancelConfirmFromState } from "./shared-pieces";
import type { JobFlowCtx } from "./use-job-flow-controller";

/** AGREED: price agreed, customer pays into escrow, pro waits. */
export function renderAgreedStage(c: JobFlowCtx, job: JobRecord): ReactElement {
  const {
    viewer,
    isLight,
    ink,
    muted,
    err,
    busy,
    router,
    goJobsList,
    calloutQuote,
    showBreakdown,
    setShowBreakdown,
    payCancelOpen,
    setPayCancelOpen,
    setCategory,
    confirmCancel,
    setConfirmCancel,
    cancelRequestInstant,
  } = c;

  return (
    <JobShell
      isLight={isLight}
      title="Price agreed"
      compactHeader
      onBack={goJobsList}
      footer={
        <AgreedFooter
          job={job}
          viewer={viewer}
          isLight={isLight}
          busy={busy}
          err={err}
          router={router}
          setPayCancelOpen={setPayCancelOpen}
        />
      }
    >
      {viewer === "repair_pro" ? (
        <AgreedPartyRow
          photo={job.motoristPhoto}
          name={job.motoristName}
          subtitle="Customer"
          ink={ink}
          muted={muted}
        />
      ) : (
        <AgreedPartyRow
          photo={job.repairProPhoto}
          name={job.repairProName}
          subtitle={PRO_SERVICE_LABELS[job.serviceType] || job.serviceType}
          ink={ink}
          muted={muted}
        />
      )}
      <AgreedPriceCard
        job={job}
        viewer={viewer}
        isLight={isLight}
        ink={ink}
        muted={muted}
        calloutQuote={calloutQuote}
        showBreakdown={showBreakdown}
        setShowBreakdown={setShowBreakdown}
      />
      {err && (
        <p className="mt-3 text-center text-[12px] font-semibold text-red-500">
          {err}
        </p>
      )}
      {payCancelOpen ? (
        <PayCancelDialog
          isLight={isLight}
          busy={busy}
          router={router}
          setCategory={setCategory}
          setPayCancelOpen={setPayCancelOpen}
          cancelRequestInstant={cancelRequestInstant}
        />
      ) : null}

      <CancelConfirmFromState
        isLight={isLight}
        confirmCancel={confirmCancel}
        setConfirmCancel={setConfirmCancel}
        cancelRequestInstant={cancelRequestInstant}
      />
    </JobShell>
  );
}
