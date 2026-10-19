import type { ReactElement } from "react";
import { Info } from "lucide-react";
import { CountdownTimer } from "@/components/jobs/countdown-timer";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { Badge } from "@/components/ui/badge";
import { apiTransition } from "@/lib/jobs/client";
import { isNegotiationTimerArmed } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { NegotiationCounterCard } from "./negotiation-counter-card";
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
  const skillTag =
    (PRO_SERVICE_LABELS[job.serviceType] || "Repair")
      .replace(/\s*Pro$/i, "")
      .trim() || "Repair";
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
      <OnaScreen
        onBack={goJobsList}
        footer={
          <NegotiationFooter
            job={job}
            viewer={viewer}
            actorId={actorId}
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
        <div className="flex min-h-0 flex-col space-y-4 pt-3">
          <div>
            <Badge variant="ona">{skillTag} request</Badge>
            <OnaTitle
              className="mt-3"
              title="Agree the labour fee"
              subtitle={
                viewer === "motorist"
                  ? "Your call-out price is already fixed. Agree labour directly with your pro, with every change recorded."
                  : "Agree labour directly with the customer, with every change recorded."
              }
            />
          </div>
          <NegotiationSummary
            job={job}
            viewer={viewer}
            isLight={isLight}
            calloutQuote={calloutQuote}
            theirOffer={theirOffer}
          />

          {canOffer ? (
            <NegotiationCounterCard
              mySide={mySide}
              offerInput={offerInput}
              setOfferInput={setOfferInput}
            />
          ) : null}

          <div className="flex items-start gap-2.5 rounded-ona-card border border-ona-brand/40 bg-ona-brand-soft p-3">
            <Info
              aria-hidden
              className="mt-0.5 h-4 w-4 shrink-0 text-ona-brand-ink"
            />
            <p className="text-[12px] leading-snug text-ona-ink">
              <span className="font-semibold">Escrow protection. </span>
              Ona protects both sides by holding the agreed total in escrow.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-3">
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
                className="text-ona-ink"
              />
            ) : (
              <p className="text-center text-[13px] font-semibold text-ona-muted">
                {viewer === "repair_pro"
                  ? "Accept the request to start the 20‑min negotiate timer"
                  : "Waiting for Repair Pro to accept this request…"}
              </p>
            )}
          </div>
        </div>
      </OnaScreen>

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
