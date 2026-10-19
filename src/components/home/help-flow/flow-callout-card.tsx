"use client";

import {
  calculateCalloutFee,
  isCalloutExcludedTrade,
  type CalloutFeeBreakdown,
} from "@/lib/callout/engine";
import {
  calloutUrgencyMultiplier,
  type CalloutUrgencyKind,
} from "@/lib/callout/urgency";
import { formatMoney } from "@/lib/pricing";
import type { ProService } from "@/lib/types";

export interface CalloutPreview {
  fee: CalloutFeeBreakdown;
  multiplier: number;
}

/**
 * Display-only estimate from the shared call-out engine, using the nearest
 * pro's distance. Null when there is nothing honest to show (no pro in range,
 * or a trade that never charges a call-out). The server stays the source of
 * truth when the job is created.
 */
export function previewCallout(
  trade: ProService,
  urgency: CalloutUrgencyKind,
  distanceKm: number | null,
): CalloutPreview | null {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return null;
  if (isCalloutExcludedTrade(trade)) return null;
  const multiplier = calloutUrgencyMultiplier(urgency);
  return {
    fee: calculateCalloutFee({
      tradeId: trade,
      approvedRouteDistanceKm: distanceKm,
      urgencyMultiplier: multiplier,
    }),
    multiplier,
  };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-ona-ctl bg-white/10 px-3 py-2.5 text-[12px]">
      <span className="font-medium text-ona-on-dark-muted">{label}</span>
      <span className="font-semibold tabular-nums text-ona-on-dark">
        {value}
      </span>
    </div>
  );
}

export function FlowCalloutCard({
  preview,
  urgencyLabel,
}: {
  preview: CalloutPreview;
  urgencyLabel: string;
}) {
  const { fee, multiplier } = preview;
  const cur = fee.currency;
  return (
    <section
      aria-label="Transparent call-out"
      className="mt-4 rounded-ona-card bg-ona-dark p-4"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#7fe0b0]">
        Transparent call-out
      </p>
      <p className="mt-1 text-[24px] font-bold tabular-nums text-ona-on-dark">
        {formatMoney(fee.calloutFee, cur)}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <Row label="Base fee" value={formatMoney(fee.tradeBaseFee, cur)} />
        <Row
          label={`${fee.billableDistanceKm} km × ${formatMoney(fee.distanceRate, cur)}`}
          value={formatMoney(fee.distanceCharge, cur)}
        />
        <Row
          label={`${urgencyLabel} multiplier`}
          value={`${multiplier.toFixed(2)}×`}
        />
      </div>
      <p className="mt-3 text-[11px] font-medium leading-snug text-ona-on-dark-muted">
        Estimate based on the nearest pro. The final call-out is fixed when a
        pro accepts.
        {fee.shortDistanceReduction
          ? " Very short trips get a 60% reduction."
          : ""}
      </p>
    </section>
  );
}
