import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getDisplayTotalMajor } from "@/lib/callout/payable";
import { formatMoney } from "@/lib/pricing";
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
  variant = "list",
  photoUrl,
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
  /** "card" = Ona v2 bordered card (History); default keeps the Requests list row. */
  variant?: "list" | "card";
  photoUrl?: string | null;
}) {
  if (variant === "card") {
    const closedBad = j.status === "cancelled" || j.status === "expired";
    const badge =
      j.status === "cancelled" ||
      j.status === "disputed" ||
      j.status === "under_appeal"
        ? "danger"
        : j.status === "expired" || j.status === "refunded"
          ? "secondary"
          : "matched";
    const total =
      j.agreedMajor != null
        ? (getDisplayTotalMajor({
            agreedMajor: j.agreedMajor,
            amountMinor: jobEscrowAmountMinor(j),
            quote: j.calloutQuote,
            fallbackQuote: j.calloutQuote,
          }) ?? j.agreedMajor)
        : null;
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full rounded-ona-card border border-ona-border bg-ona-surface p-4 text-left active:bg-ona-field"
      >
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "min-w-0 text-[14px] font-semibold text-ona-ink",
              closedBad && "line-through",
            )}
          >
            {skill} · {when}
          </p>
          <Badge variant={badge} className="shrink-0 normal-case">
            {statusText}
          </Badge>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={photoUrl || undefined} alt="" />
            <AvatarFallback className="text-[10px]">
              {(name || "?").trim().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-[13px] text-ona-ink">{name}</span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3 border-t border-ona-border pt-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-[12px] leading-snug text-ona-muted">
              {j.problem}
            </p>
            {suffix ? (
              <p className="mt-1 text-[11px] text-ona-muted">
                {suffix.replace(/^ · /, "")}
              </p>
            ) : null}
          </div>
          {total != null ? (
            <p className="shrink-0 text-[14px] font-bold tabular-nums text-ona-ink">
              {formatMoney(total, j.currency)}
            </p>
          ) : null}
        </div>
      </button>
    );
  }
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
