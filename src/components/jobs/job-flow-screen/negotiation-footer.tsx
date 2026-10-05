import type { ReactElement } from "react";
import { CopperButton } from "@/components/jobs/job-shell";
import { apiAcceptOffer, apiPlaceOffer } from "@/lib/jobs/client";
import { MAX_OFFER_DIGITS, MIN_OFFER_AMOUNT_MAJOR } from "@/lib/jobs/constants";
import type { JobOffer, JobRecord } from "@/lib/jobs/types";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { JobApiResult, JobViewer } from "./types";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  actorId: string;
  isLight: boolean;
  ink: string;
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
  isLight,
  ink,
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
  return (
    <div className="space-y-1.5">
      {canAccept && last && (
        <CopperButton
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
        </CopperButton>
      )}
      {canOffer && (
        <div className="space-y-1">
          <div className="flex gap-1.5">
            <input
              inputMode="numeric"
              pattern="[1-9][0-9]*"
              maxLength={MAX_OFFER_DIGITS}
              value={offerInput}
              onChange={(e) => {
                const raw = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, MAX_OFFER_DIGITS);
                if (raw === "") {
                  setOfferInput("");
                  return;
                }
                if (/^0+$/.test(raw)) {
                  setOfferInput("");
                  return;
                }
                setOfferInput(raw.replace(/^0+/, "") || raw);
              }}
              placeholder={
                mySide === "repair_pro"
                  ? `Labour price (min ${formatMoney(MIN_OFFER_AMOUNT_MAJOR)})`
                  : "Counter (max 50% off)"
              }
              className={cn(
                "h-11 flex-1 rounded-md border-0 bg-transparent px-3 text-[14px] font-medium outline-none ring-1",
                isLight
                  ? "text-slate-900 ring-black/20 placeholder:text-slate-500 focus:ring-[#FF6B35]/55"
                  : "text-white ring-white/25 placeholder:text-white/40 focus:ring-[#FF6B35]/55",
              )}
              aria-label="Labour price offer"
            />
            <button
              type="button"
              disabled={
                busy ||
                !offerInput ||
                Number(offerInput.replace(/\D/g, "")) < MIN_OFFER_AMOUNT_MAJOR
              }
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
              className="h-11 shrink-0 rounded-md border-0 bg-[#FF6B35] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
      {viewer === "motorist" ? (
        <button
          type="button"
          className={cn(
            "inline-flex h-11 w-full items-center justify-center rounded-md border-0 bg-transparent text-[13px] font-medium",
            ink,
          )}
          onClick={() => setConfirmCancel({ actor: "motorist" })}
        >
          Cancel request
        </button>
      ) : null}
    </div>
  );
}
