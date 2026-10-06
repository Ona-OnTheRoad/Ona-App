"use client";

import { Loader2, Lock } from "lucide-react";
import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import { jobEscrowAmountMinor } from "@/lib/callout/payable";
import type { JobRecord } from "@/lib/jobs/types";
import { forceNairaCurrency } from "@/lib/pricing";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn } from "@/lib/utils";
import { isJobPayable } from "../shared/job-status";
import type { CheckoutTone } from "./types";

type ChargeLinesProps = Parameters<typeof JobChargeLines>[0];

export function SummaryView({
  tone,
  job,
  amountLabel,
  chargeParts,
  agreedMajor,
  calloutQuote,
  err,
  onPay,
}: {
  tone: CheckoutTone;
  job: JobRecord | null;
  amountLabel: string;
  chargeParts: unknown;
  agreedMajor: number | null;
  calloutQuote: ChargeLinesProps["quote"];
  err: string | null;
  onPay: () => void;
}) {
  const { isLight, card, ink, muted } = tone;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-hide">
        {/* Amount hero */}
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl px-5 py-6 shadow-sm",
            card,
          )}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#FF6B35]/15" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-sky-500/10" />
          <p className={cn("text-[12px] font-semibold", muted)}>Amount</p>
          <p className={cn("mt-1 text-[34px] font-black tracking-tight", ink)}>
            {amountLabel}
          </p>
          {chargeParts ? (
            <div className="mt-3">
              <JobChargeLines
                agreedMajor={agreedMajor}
                amountMinor={jobEscrowAmountMinor(job)}
                quote={calloutQuote}
                fallbackQuote={job?.calloutQuote}
                currency={forceNairaCurrency(job?.currency)}
                ink={ink}
                muted={muted}
                compact
                isLight={isLight}
              />
              <p className="pt-1 text-[10px] font-medium leading-snug">
                Pay this exact amount only. Your bank may add its own transfer
                fee. Do not change the transfer amount.
              </p>
            </div>
          ) : null}
        </div>

        {/* Job summary */}
        <div className={cn("mt-3 rounded-2xl px-4 py-3.5 shadow-sm", card)}>
          <p
            className={cn(
              "text-[11px] font-bold uppercase tracking-wide",
              muted,
            )}
          >
            Booking
          </p>
          {!job ? (
            <div className="mt-3 flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
            </div>
          ) : (
            <dl className="mt-2 space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className={muted}>Repair Pro</dt>
                <dd className={cn("truncate font-bold", ink)}>
                  {job.repairProName}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className={muted}>Service</dt>
                <dd className={cn("font-bold", ink)}>
                  {PRO_SERVICE_LABELS[job.serviceType] || job.serviceType}
                </dd>
              </div>
              {isAutomotiveTrade(job.serviceType) && job.motoristVehicle ? (
                <div className="flex justify-between gap-3">
                  <dt className={muted}>Vehicle</dt>
                  <dd className={cn("truncate font-bold", ink)}>
                    {job.motoristVehicle}
                  </dd>
                </div>
              ) : null}
            </dl>
          )}
        </div>

        {/* Bank transfer only USSD and other methods disabled */}
        <div className={cn("mt-3 rounded-2xl px-4 py-3.5 shadow-sm", card)}>
          <p
            className={cn(
              "text-[11px] font-bold uppercase tracking-wide",
              muted,
            )}
          >
            Method
          </p>
          <div
            className={cn(
              "mt-2 flex w-full items-center justify-between rounded-xl border-0 px-3 py-3 text-left text-[13px] font-bold",
              card,
            )}
          >
            <span>Bank transfer</span>
            <span className={cn("text-[11px] font-semibold", muted)}>Only</span>
          </div>
        </div>

        {err ? (
          <p className="mt-3 text-center text-[12px] font-semibold text-red-500">
            {err}
          </p>
        ) : null}
      </div>

      {/* Pay bar pinned to the bottom of the page */}
      <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={!job || !isJobPayable(job)}
          onClick={onPay}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-0 bg-[#FF6B35] text-[15px] font-black text-white disabled:opacity-45"
        >
          <Lock className="h-4 w-4" />
          {job?.status === "cancelled" || job?.status === "expired"
            ? "Pay again"
            : "Pay"}
        </button>
      </div>
    </div>
  );
}
