import { CheckCircle2, X } from "lucide-react";
import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import { satisfiedReleaseEndsAtIso } from "@/lib/jobs/constants";
import type { JobRecord } from "@/lib/jobs/types";
import { formatMoney, forceNairaCurrency } from "@/lib/pricing";
import { jobCalloutQuoteOf, jobEscrowAmountMinor } from "@/lib/callout/payable";
import type { CalloutQuote } from "@/lib/callout/constants";
import { cn } from "@/lib/utils";
import { AutoReleaseCountdown } from "./auto-release-countdown";
import { SwipeToRelease } from "./swipe-to-release";

export function ReleaseDialog({
  pending,
  pendingTotal,
  calloutQuote,
  isLight,
  err,
  setErr,
  busy,
  backendUserId,
  onMinimize,
  onSatisfied,
}: {
  pending: JobRecord;
  pendingTotal: number | null;
  calloutQuote: CalloutQuote | null;
  isLight: boolean;
  err: string | null;
  setErr: (v: string | null) => void;
  busy: boolean;
  backendUserId: string | null;
  onMinimize: () => void;
  onSatisfied: () => void;
}) {
  const ink = isLight ? "#1a1b1e" : "#ffffff";
  const muted = isLight ? "#5c6370" : "rgba(255,255,255,0.65)";
  const card = isLight ? "#d4d5d9" : "#1c1c1e";
  const currency = forceNairaCurrency(pending.currency);
  const endsAt = satisfiedReleaseEndsAtIso(pending);
  return (
    <div
      className="absolute inset-0 z-[96] flex flex-col"
      role="dialog"
      aria-modal
      aria-label="Release payment"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: isLight ? "#00000066" : "#000000b3" }}
        onClick={onMinimize}
        aria-hidden
      />
      <div
        className="relative z-10 m-auto flex w-[min(100%-1.5rem,380px)] flex-col rounded-2xl px-5 py-6 shadow-xl"
        style={{ backgroundColor: card }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#FF6B35]">
            Release
          </p>
          <button
            type="button"
            onClick={onMinimize}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-full border-0",
              isLight ? "bg-black/8 text-slate-800" : "bg-white/10 text-white",
            )}
            aria-label="Minimize"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <p
          className="mt-3 text-center text-[17px] font-black leading-snug"
          style={{ color: ink }}
        >
          Release payment
        </p>
        <p
          className="mt-2 text-center text-[12px] font-medium leading-snug"
          style={{ color: muted }}
        >
          Confirm the job is done to release payment to your Repair Pro
        </p>
        {pending != null && pending.agreedMajor != null ? (
          <div className="mt-3">
            <JobChargeLines
              agreedMajor={pending.agreedMajor}
              amountMinor={jobEscrowAmountMinor(pending)}
              quote={calloutQuote}
              fallbackQuote={jobCalloutQuoteOf(pending)}
              currency={currency}
              ink={isLight ? "text-slate-900" : "text-white"}
              muted={isLight ? "text-slate-600" : "text-white/60"}
              isLight={isLight}
            />
          </div>
        ) : pendingTotal != null ? (
          <p
            className="mt-3 text-center text-[22px] font-black tabular-nums"
            style={{ color: ink }}
          >
            {formatMoney(pendingTotal, currency)}
          </p>
        ) : null}

        {endsAt ? <AutoReleaseCountdown endsAt={endsAt} /> : null}

        {err ? (
          <div
            className="mt-3 max-h-36 overflow-y-auto rounded-lg border border-red-500/40 bg-red-50 px-3 py-2 text-left"
            role="alert"
          >
            <p className="text-[12px] font-semibold leading-snug text-red-700">
              {err}
            </p>
            <div className="mt-1.5 flex gap-2">
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(err)}
                className="text-[11px] font-bold text-red-700 underline"
              >
                Copy error
              </button>
              <button
                type="button"
                onClick={() => setErr(null)}
                className="text-[11px] font-bold text-red-700 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <SwipeToRelease
          onRelease={() => void onSatisfied()}
          busy={busy || !backendUserId}
          isLight={isLight}
        />
      </div>
    </div>
  );
}
