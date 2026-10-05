import type { ReactElement } from "react";
import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import type { CalloutQuote } from "@/lib/callout/constants";
import {
  getDisplayTotalMajor,
  jobEscrowAmountMinor,
} from "@/lib/callout/payable";
import type { JobRecord } from "@/lib/jobs/types";
import { formatMoney } from "@/lib/pricing";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn } from "@/lib/utils";
import type { JobViewer } from "./types";
import { TRIP_STATUS_LABEL } from "./trip-pro-advance";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
  ink: string;
  muted: string;
  calloutQuote: CalloutQuote | null | undefined;
}

/**
 * Lower-panel meta row only (map keeps ETA + ESCROW Held exclusively).
 * Customer: skill (Mechanic) + pro name only, no BOOKED chip.
 * Pro: status + skill + vehicle card.
 */
export function TripMetaHeader({
  job,
  viewer,
  isLight,
  ink,
  muted,
  calloutQuote,
}: Props): ReactElement {
  const statusLabel = TRIP_STATUS_LABEL;
  // Status / skill / name / ₦ solid lower panel only (never map overlay).
  // en_route uses mixed-case "OnTheRoad" no CSS uppercase.
  const statusChip = (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[9px] font-black text-white",
        job.status === "en_route"
          ? "tracking-normal"
          : "uppercase tracking-wide",
        job.status === "paid_booked"
          ? "bg-emerald-600"
          : job.status === "en_route" || job.status === "in_progress"
            ? "bg-[#FF6B35]"
            : isLight
              ? "bg-slate-800"
              : "bg-[#3a3a3c]",
      )}
    >
      {job.status === "paid_booked"
        ? "Booked"
        : statusLabel[job.status] || job.status}
    </span>
  );

  const skillChip = (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[9px] font-bold",
        isLight ? "bg-[#a8a9ae] text-slate-900" : "bg-[#2c2c2e] text-white",
      )}
    >
      {PRO_SERVICE_LABELS[job.serviceType] || job.serviceType}
    </span>
  );

  // Pro: vehicle details (not customer name). Customer: pro name.
  const vehicleLabel = (job.motoristVehicle || "").trim();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {viewer === "repair_pro" ? statusChip : null}
        {skillChip}
        {viewer === "motorist" ? (
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-[16px] font-black",
              ink,
            )}
          >
            {job.repairProName}
          </p>
        ) : null}
        {job.agreedMajor != null ? (
          <p
            className={cn(
              "ml-auto shrink-0 text-[15px] font-black tabular-nums",
              isLight ? "text-black" : "text-white",
            )}
          >
            {formatMoney(
              getDisplayTotalMajor({
                agreedMajor: job.agreedMajor,
                amountMinor: jobEscrowAmountMinor(job),
                quote: calloutQuote ?? job.calloutQuote,
                fallbackQuote: job.calloutQuote,
              }) ?? job.agreedMajor,
              job.currency,
            )}
          </p>
        ) : null}
      </div>
      <div className="mt-1">
        <JobChargeLines
          agreedMajor={job.agreedMajor}
          amountMinor={jobEscrowAmountMinor(job)}
          quote={calloutQuote ?? job.calloutQuote}
          fallbackQuote={job.calloutQuote}
          currency={job.currency}
          ink={ink}
          muted={muted}
          compact
          isLight={isLight}
        />
      </div>
      {viewer === "repair_pro" && isAutomotiveTrade(job.serviceType) ? (
        <div
          className={cn(
            "rounded-xl px-3 py-2.5",
            isLight ? "bg-black/[0.05]" : "bg-white/[0.06]",
          )}
        >
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.08em]",
              muted,
            )}
          >
            Vehicle
          </p>
          <p
            className={cn(
              "mt-0.5 text-[15px] font-black leading-snug tracking-tight",
              ink,
            )}
          >
            {vehicleLabel || "Vehicle details not set"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
