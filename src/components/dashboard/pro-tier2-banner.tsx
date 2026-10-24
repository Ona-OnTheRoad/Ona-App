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
      className="flex w-full items-center justify-between rounded-2xl border border-[#FDE5D6] dark:border-orange-900/40 bg-[#FFF4ED] dark:bg-orange-950/20 p-3.5 px-4 text-left transition hover:bg-[#FFEAE0] active:scale-[0.99] cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center text-[#FF6B35]">
          <Scan className="h-7 w-7 stroke-[1.8]" />
          <User className="absolute h-3.5 w-3.5 stroke-[2.2]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            TIER {tierNumber}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white leading-tight">
            Continue Verification
          </p>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    </button>
  );
}
