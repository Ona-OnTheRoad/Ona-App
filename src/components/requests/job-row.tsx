import { ChevronRight } from "lucide-react";
import { JobChargeLines } from "@/components/jobs/callout-fee-lines";
import { jobEscrowAmountMinor } from "@/lib/callout/payable";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";

/** Shared list row for Requests and History. */
export function JobRow({
  j,
  name,
  skill,
  when,
  suffix,
  badgeClass,
  statusText,
  isLight,
  ink,
  muted,
  onClick,
}: {
  j: JobRecord;
  name: string;
  skill: string;
  when: string;
  suffix: string;
  badgeClass: string;
  statusText: string;
  isLight: boolean;
  ink: string;
  muted: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 border-0 bg-transparent py-3.5 text-left"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
              badgeClass,
            )}
          >
            {statusText}
          </span>
          <span className={cn("text-[10px] font-medium", muted)}>{skill}</span>
        </div>
        <p className={cn("mt-1.5 truncate text-[15px] font-semibold", ink)}>
          {name}
        </p>
        <p
          className={cn(
            "mt-0.5 line-clamp-2 text-[13px] font-medium leading-snug",
            muted,
          )}
        >
          {j.problem}
        </p>
        <p className={cn("mt-1 text-[11px] font-medium", muted)}>
          {when}
          {suffix}
        </p>
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
  );
}
