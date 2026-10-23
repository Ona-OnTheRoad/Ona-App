"use client";

import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferralCodeCardProps {
  referralCode: string;
  copied: boolean;
  onCopy: () => void;
  isLight?: boolean;
}

export function ReferralCodeCard({
  referralCode,
  copied,
  onCopy,
}: ReferralCodeCardProps) {
  const displayCode = referralCode || "ONANTAV2B375E";

  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-4 shadow-2xs transition-colors">
      <p className="text-[11px] font-bold tracking-wider uppercase mb-1 text-ona-muted">
        Refer & Earn
      </p>

      <p className="text-[12px] leading-normal mb-3.5 text-ona-muted">
        Share your code. Earn credits when friends sign up.
      </p>

      {/* Code Display + Copy button */}
      <div className="flex items-center justify-between rounded-ona-ctl border border-ona-border bg-ona-field p-2 pl-4 transition-colors">
        <code className="text-[12px] font-semibold tracking-wider select-all text-ona-ink">
          {displayCode}
        </code>

        <button
          type="button"
          onClick={onCopy}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-ona-ctl text-[12px] font-medium text-white transition-all active:scale-95 cursor-pointer shadow-xs",
            copied ? "bg-ona-success" : "bg-brand hover:opacity-90",
          )}
        >
          {copied ? (
            <>
              <span>Copied</span>
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </>
          ) : (
            <>
              <span>Copy</span>
              <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
