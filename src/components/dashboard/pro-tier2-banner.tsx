"use client";

import { ChevronRight, ShieldCheck } from "lucide-react";

interface ProTier2BannerProps {
  onContinue: () => void;
  tierNumber?: number;
}

export function ProTier2Banner({
  onContinue,
  tierNumber = 2,
}: ProTier2BannerProps) {
  return (
    <button
      type="button"
      onClick={onContinue}
      className="flex w-full items-center justify-between rounded-2xl border border-[#FF6B35]/25 bg-[#FF6B35]/[0.04] p-3.5 text-left transition hover:bg-[#FF6B35]/[0.08] cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF6B35]/15 text-[#FF6B35]">
          <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-md bg-[#FF6B35]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#FF6B35] uppercase tracking-wide">
            Tier {tierNumber}
          </span>
          <p className="mt-0.5 text-[14px] font-bold text-ona-ink leading-tight">
            Continue Verification
          </p>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 shrink-0 text-ona-muted" />
    </button>
  );
}
