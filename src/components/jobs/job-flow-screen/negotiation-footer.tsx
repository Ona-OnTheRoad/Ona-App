import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { apiAcceptOffer, apiPlaceOffer } from "@/lib/jobs/client";
import { MIN_OFFER_AMOUNT_MAJOR } from "@/lib/jobs/constants";
import type { JobOffer, JobRecord } from "@/lib/jobs/types";
import { formatMoney } from "@/lib/pricing";
import type { JobApiResult, JobViewer } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  actorId: string;
  busy: boolean;
  offerInput: string;
  setOfferInput: (v: string) => void;
  setErr: (v: string | null) => void;
  setConfirmCancel: (v: { actor: JobViewer } | null) => void;
  run: (fn: () => Promise<JobApiResult>) => Promise<void>;
  last: JobOffer | undefined;
  mySide: JobViewer;
  canOffer: boolean;
  canAccept: boolean;
}

/** Negotiate footer: Accept, offer input + Send, and customer Cancel. */
export function NegotiationFooter({
  job,
  viewer,
  actorId,
  busy,
  offerInput,
  setOfferInput,
  setErr,
  setConfirmCancel,
  run,
  last,
  mySide,
  canOffer,
  canAccept,
}: Props): ReactElement {
  const parsed = Number(offerInput.replace(/\D/g, ""));
  const sendDisabled = busy || !offerInput || parsed < MIN_OFFER_AMOUNT_MAJOR;
  return (
    <div className="space-y-1">
      <div className={canAccept && canOffer ? "grid grid-cols-2 gap-3" : ""}>
        {canOffer && (
          <Button
            size="ona"
            variant={canAccept ? "onaOutline" : "ona"}
            disabled={sendDisabled}
            onClick={() =>
              void run(async () => {
                const amount = Number(offerInput.replace(/\D/g, ""));
                if (
                  !Number.isFinite(amount) ||
                  amount < MIN_OFFER_AMOUNT_MAJOR
                ) {
                  const msg = `Minimum service charge is ${formatMoney(MIN_OFFER_AMOUNT_MAJOR)}.`;
                  setErr(msg);
                  return {
                    ok: false as const,
                    message: msg,
                  };
                }
                const res = await apiPlaceOffer({
                  jobId: job.id,
                  side: mySide,
                  actorId,
                  amountMajor: amount,
                });
                if (res.ok) setOfferInput("");
                return res;
              })
            }
          >
            {offerInput && parsed > 0
              ? `Send ${formatMoney(parsed, job.currency)}`
              : "Send offer"}
          </Button>
        )}
        {canAccept && last && (
          <Button
            size="ona"
            variant="ona"
            disabled={busy}
            onClick={() =>
              void run(() =>
                apiAcceptOffer({
                  jobId: job.id,
                  side: mySide,
                  actorId,
                }),
              )
            }
          >
            Accept {formatMoney(last.amountMajor, job.currency)}
          </Button>
        )}
      </div>
      {viewer === "motorist" ? (
        <button
          type="button"
          className="inline-flex h-11 w-full items-center justify-center rounded-ona-ctl border-0 bg-transparent text-[13px] font-medium text-ona-muted"
          onClick={() => setConfirmCancel({ actor: "motorist" })}
        >
          Cancel request
        </button>
      ) : null}
    </div>
  );
}
