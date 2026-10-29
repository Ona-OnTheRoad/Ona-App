"use client";

import { ChevronRight, Scan, User } from "lucide-react";

interface ProTier2BannerProps {
  onContinue: () => void;
  tierNumber?: number;
}

export function ProTier2Banner({
  onContinue,
  tierNumber = 3,
}: ProTier2BannerProps) {
  return (
    <button
      type="button"
      onClick={onContinue}
      className="flex w-full items-center justify-between rounded-2xl border border-ona-brand-soft dark:border-ona-brand-border bg-ona-brand-soft p-3.5 px-4 text-left transition hover:bg-ona-brand-active dark:hover:opacity-95 active:scale-[0.99] cursor-pointer"
    >
      {/* Light mode layout */}
      <div className="flex items-center gap-3 min-w-0 dark:hidden">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center text-brand">
          <Scan className="h-7 w-7 stroke-[1.8]" />
          <User className="absolute h-3.5 w-3.5 stroke-[2.2]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
            TIER {tierNumber}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 leading-tight">
            Continue Verification
          </p>
        </div>
      </div>

      {/* Dark mode layout */}
      <div className="hidden dark:flex flex-col gap-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="relative flex h-5 w-5 shrink-0 items-center justify-center text-ona-brand">
            <Scan className="h-5 w-5 stroke-[1.8]" />
            <User className="absolute h-2.5 w-2.5 stroke-[2.2]" />
          </div>
          <p className="text-[11px] font-bold text-ona-muted tracking-[0.14em] uppercase">
            TIER {tierNumber}
          </p>
        </div>

        <p className="text-[15px] font-normal text-ona-ink leading-tight">
          Continue Verification
        </p>
      </div>

      <ChevronRight className="h-4 w-4 dark:h-5 dark:w-5 shrink-0 text-slate-400 dark:text-ona-muted" />
    </button>
  );
}
