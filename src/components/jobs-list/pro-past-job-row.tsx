import { ChevronRight } from "lucide-react";
import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import { jobEscrowAmountMinor } from "@/lib/callout/payable";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { cn } from "@/lib/utils";
import { meetAddress } from "./job-location";
import { formatWhen, statusLabel } from "./pro-past-format";

export function ProPastJobRow({
  j,
  ink,
  muted,
  isLight,
  onOpen,
}: {
  j: JobRecord;
  ink: string;
  muted: string;
  isLight: boolean;
  onOpen: (href: string) => void;
}) {
  const addr = meetAddress(j);
  const when = formatWhen(j.updatedAt || j.createdAt);
  return (
    <li key={j.id}>
      <button
        type="button"
        onClick={() => onOpen(`/requests/${j.id}`)}
        className={cn(
          "flex w-full items-start gap-2.5 border-0 bg-transparent py-3.5 text-left active:opacity-90",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wide",
                muted,
              )}
            >
              {statusLabel(j.status)}
            </span>
            {when ? (
              <span className={cn("text-[10px] font-medium", muted)}>
                · {when}
              </span>
            ) : null}
          </div>
          <p className={cn("mt-1 truncate text-[15px] font-semibold", ink)}>
            {isAutomotiveTrade(j.serviceType) && j.motoristVehicle?.trim()
              ? j.motoristVehicle.trim()
              : j.motoristName?.split(/\s+/)[0] ||
                PRO_SERVICE_LABELS[j.serviceType] ||
                "Service Request"}
          </p>
          {j.problem?.trim() ? (
            <p
              className={cn(
                "mt-0.5 line-clamp-2 text-[12px] font-medium leading-snug",
                muted,
              )}
            >
              {j.problem}
            </p>
          ) : null}
          {addr ? (
            <p
              className={cn(
                "mt-0.5 line-clamp-1 text-[12px] font-medium",
                muted,
              )}
            >
              {addr}
            </p>
          ) : null}
          {j.agreedMajor != null ? (
            <div className="mt-1.5">
              <JobChargeLines
                agreedMajor={j.agreedMajor}
                amountMinor={jobEscrowAmountMinor(j)}
                quote={j.calloutQuote}
                fallbackQuote={j.calloutQuote}
                currency={j.currency}
                ink={ink}
                muted={muted}
                compact
                isLight={isLight}
              />
            </div>
          ) : null}
        </div>
        <ChevronRight
          className={cn("mt-1 h-4 w-4 shrink-0", muted)}
          aria-hidden
        />
      </button>
    </li>
  );
}
