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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { JobViewer } from "./types";
import { TRIP_STATUS_LABEL } from "./trip-pro-advance";

interface Props {
  job: JobRecord;
  viewer: JobViewer;
  isLight: boolean;
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
  calloutQuote,
}: Props): ReactElement {
  const statusLabel = TRIP_STATUS_LABEL;
  const tradeLabel = PRO_SERVICE_LABELS[job.serviceType] || job.serviceType;
  // Pro-only status chip (en_route keeps mixed-case "OnTheRoad").
  const statusChip = (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-[10px] font-bold",
        job.status === "en_route"
          ? "tracking-normal"
          : "uppercase tracking-wide",
        job.status === "paid_booked"
          ? "bg-ona-success-soft text-ona-success"
          : job.status === "en_route" || job.status === "in_progress"
            ? "bg-ona-brand-soft text-ona-brand-ink"
            : "bg-ona-field-strong text-ona-ink",
      )}
    >
      {job.status === "paid_booked"
        ? "Booked"
        : statusLabel[job.status] || job.status}
    </span>
  );

  const skillChip = (
    <span className="rounded-full bg-ona-field-strong px-2 py-1 text-[10px] font-semibold text-ona-ink">
      {tradeLabel}
    </span>
  );

  // Customer ETA bar: server etaMinutes while the pro is en route.
  const etaBar =
    viewer === "motorist" && job.status === "en_route" ? (
      <p
        role="status"
        className="rounded-ona-ctl bg-ona-dark px-3 py-2.5 text-center text-[12px] font-semibold text-ona-on-dark"
      >
        {job.etaMinutes != null
          ? `Arrival ETA ${job.etaMinutes} min.`
          : `${tradeLabel} is OnTheRoad`}
      </p>
    ) : null;

  const vehicleLabel = (job.motoristVehicle || "").trim();
  const total =
    job.agreedMajor != null
      ? formatMoney(
          getDisplayTotalMajor({
            agreedMajor: job.agreedMajor,
            amountMinor: jobEscrowAmountMinor(job),
            quote: calloutQuote ?? job.calloutQuote,
            fallbackQuote: job.calloutQuote,
          }) ?? job.agreedMajor,
          job.currency,
        )
      : null;

  return (
    <div className="flex flex-col gap-3">
      {etaBar}
      {viewer === "motorist" ? (
        <div className="flex items-center gap-3 rounded-ona-card border border-ona-border bg-ona-surface p-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={job.repairProPhoto} alt="" />
            <AvatarFallback>
              {(job.repairProName || "?").trim().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ona-ink">
              {job.repairProName}
            </p>
            <div className="mt-1">{skillChip}</div>
          </div>
          {total ? (
            <p className="shrink-0 text-[15px] font-bold tabular-nums text-ona-ink">
              {total}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          {statusChip}
          {skillChip}
          {total ? (
            <p className="ml-auto shrink-0 text-[15px] font-bold tabular-nums text-ona-ink">
              {total}
            </p>
          ) : null}
        </div>
      )}
      <JobChargeLines
        agreedMajor={job.agreedMajor}
        amountMinor={jobEscrowAmountMinor(job)}
        quote={calloutQuote ?? job.calloutQuote}
        fallbackQuote={job.calloutQuote}
        currency={job.currency}
        ink="text-ona-ink"
        muted="text-ona-muted"
        compact
        isLight={isLight}
      />
      {viewer === "repair_pro" && isAutomotiveTrade(job.serviceType) ? (
        <div className="rounded-ona-card border border-ona-border bg-ona-field px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ona-muted">
            Vehicle
          </p>
          <p className="mt-0.5 text-[15px] font-semibold leading-snug tracking-tight text-ona-ink">
            {vehicleLabel || "Vehicle details not set"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
