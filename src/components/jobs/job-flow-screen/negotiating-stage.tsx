import type { ReactElement } from "react";
import { Minimize2 } from "lucide-react";
import { CountdownTimer } from "@/components/jobs/countdown-timer";
import { JobShell } from "@/components/jobs/job-shell";
import { apiTransition } from "@/lib/jobs/client";
import { isNegotiationTimerArmed } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import { NegotiationFooter } from "./negotiation-footer";
import { NegotiationSummary } from "./negotiation-summary";
import { CancelConfirmFromState, RerouteAlertOverlay } from "./shared-pieces";
import type { JobFlowCtx } from "./use-job-flow-controller";

/** NEGOTIATING / NEW REQUEST. */
export function renderNegotiatingStage(
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
    offerInput,
    setOfferInput,
    calloutQuote,
    goJobsList,
    setConfirmCancel,
    confirmCancel,
    cancelRequestInstant,
    rerouteAlert,
    setRerouteAlert,
    run,
    commitJob,
    jobRef,
  } = c;
  const last = job.offers[job.offers.length - 1];
  const mySide = viewer === "motorist" ? "motorist" : "repair_pro";
  const canOffer =
    job.offers.length < job.maxOffers &&
    (job.offers.length > 0 || mySide === "repair_pro");
  const canAccept = Boolean(last && last.side !== mySide);
  const theirOffer =
    last && last.side !== mySide
      ? last
      : [...job.offers].reverse().find((o) => o.side !== mySide);

  return (
    <>
      <JobShell
        isLight={isLight}
        title="Negotiate labour"
        compactHeader
        onBack={goJobsList}
        backIcon={
          viewer === "motorist" ? <Minimize2 className="h-4 w-4" /> : undefined
        }
        footer={
          <NegotiationFooter
            job={job}
            viewer={viewer}
            actorId={actorId}
            isLight={isLight}
            ink={ink}
            busy={busy}
            offerInput={offerInput}
            setOfferInput={setOfferInput}
            setErr={setErr}
            setConfirmCancel={setConfirmCancel}
            run={run}
            last={last}
            mySide={mySide}
            canOffer={canOffer}
            canAccept={canAccept}
          />
        }
      >
        {/* Top: vehicle/service/problem + offers · Middle: ring timer */}
        <div className="flex min-h-0 flex-col bg-transparent px-0.5 pt-1">
          <NegotiationSummary
            job={job}
            viewer={viewer}
            isLight={isLight}
            ink={ink}
            muted={muted}
            calloutQuote={calloutQuote}
            theirOffer={theirOffer}
          />

          <div className="flex min-h-[42vh] flex-1 flex-col items-center justify-center bg-transparent py-5">
            {isNegotiationTimerArmed(job) ? (
              <CountdownTimer
                variant="ring"
                endsAt={job.negotiateEndsAt}
                onExpire={() => {
                  const j = jobRef.current;
                  if (j) {
                    const ts = new Date().toISOString();
                    commitJob(
                      {
                        ...j,
                        status: "expired",
                        updatedAt: ts,
                        statusHistory: [
                          ...(j.statusHistory || []),
                          { status: "expired", at: ts, by: "system" },
                        ],
                      },
                      true,
                    );
                  }
                  void apiTransition({
                    jobId: job.id,
                    event: "EXPIRE_NEGOTIATION",
                    actor: "system",
                  })
                    .then((res) => {
                      if (res.ok) commitJob(res.data.job, true);
                    })
                    .catch(() => {
                      /* optimistic expired already applied */
                    });
                }}
                className={ink}
              />
            ) : (
              <p className={cn("text-center text-[13px] font-semibold", muted)}>
                {viewer === "repair_pro"
                  ? "Accept the request to start the 20‑min negotiate timer"
                  : "Waiting for Repair Pro to accept this request…"}
              </p>
            )}
          </div>
        </div>
        {err && (
          <p className="mt-1 text-center text-[12px] font-medium text-red-500">
            {err}
          </p>
        )}
      </JobShell>

      {/* Reroute notification overlay for motorist */}
      {rerouteAlert && viewer === "motorist" && (
        <RerouteAlertOverlay
          isLight={isLight}
          ink={ink}
          muted={muted}
          onContinue={() => setRerouteAlert(null)}
        />
      )}

      <CancelConfirmFromState
        isLight={isLight}
        confirmCancel={confirmCancel}
        setConfirmCancel={setConfirmCancel}
        cancelRequestInstant={cancelRequestInstant}
      />
    </>
  );
}
