"use client";

import { ChevronRight, CreditCard, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tier2GovernmentIdCardProps {
  isLight?: boolean;
  phoneOk: boolean;
  submitted?: boolean;
  tier2Ok?: boolean;
  onClick: () => void;
  isPro?: boolean;
}

export function Tier2GovernmentIdCard({
  phoneOk,
  submitted = false,
  tier2Ok = false,
  onClick,
  isPro = false,
}: Tier2GovernmentIdCardProps) {
  const isClickable = phoneOk && !submitted && !tier2Ok;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "rounded-ona-ctl border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4.5 transition-all shadow-xs group",
        isClickable
          ? "cursor-pointer hover:bg-black/1.5 active:bg-black/3 dark:hover:bg-white/2"
          : !phoneOk
            ? "opacity-60 cursor-not-allowed"
            : "cursor-default",
      )}
    >
      {/* Header Row: TIER 2 + Status indicator */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ona-muted">
          TIER 2
        </span>

        {tier2Ok ? (
          <span className="text-[12px] font-semibold text-ona-success">
            Approved
          </span>
        ) : submitted ? (
          <span className="text-[12px] font-semibold text-amber-500">
            Under review
          </span>
        ) : !phoneOk ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ona-muted">
            <Lock className="h-3 w-3" /> Locked
          </span>
        ) : null}
      </div>

      {/* Row Item: Brand soft icon box + Government ID (NIN) + Chevron */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ona-brand-soft">
            <CreditCard className="h-3.5 w-3.5 text-brand" strokeWidth={2.4} />
          </div>
          <span className="text-[12px] font-medium leading-tight truncate text-ona-ink">
            Government ID (NIN)
          </span>
        </div>

        {isClickable ? (
          <ChevronRight
            className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 text-ona-muted"
            strokeWidth={2}
          />
        ) : null}
      </div>

      {/* Divider */}
      <div className="border-b border-ona-border dark:border-[#18181B] mt-3.5" />

      {/* Helper text if locked or under review */}
      {!phoneOk ? (
        <p className="text-[12px] mt-2.5 text-ona-muted">
          Complete Tier 1 phone verification first to unlock.
        </p>
      ) : submitted && !tier2Ok ? (
        <p className="text-[12px] mt-2.5 text-amber-600 dark:text-amber-400 font-medium">
          {isPro
            ? "Under review · Unlocks once Care approves your ID."
            : "Under review · Full booking unlocks when Care approves your ID."}
        </p>
      ) : null}
    </div>
  );
}
