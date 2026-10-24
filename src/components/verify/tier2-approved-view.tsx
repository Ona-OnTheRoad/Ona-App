"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2 } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";

interface Tier2ApprovedViewProps {
  isLight?: boolean;
}

export function Tier2ApprovedView({ isLight: _propIsLight }: Tier2ApprovedViewProps) {
  const router = useRouter();
  const { accountType } = useApp();

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-12 flex flex-col min-h-full">
        {/* Top Back bar */}
        <div className="flex items-center pt-3 pb-1 mb-2">
          <button
            type="button"
            onClick={() => navigateBack(router, "/profile", accountType)}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 active:opacity-70"
            aria-label="Back to Profile"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        {/* Screen Title */}
        <h1 className="text-[24px] font-bold tracking-tight mb-8 text-ona-ink">
          Verification
        </h1>

        {/* Center Hero */}
        <div className="flex-1 flex flex-col items-center justify-center pt-2 pb-6">
          {/* Mint Circle Badge */}
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-ona-success-soft">
            {/* Scalloped Badge with Checkmark */}
            <svg
              className="h-11 w-11 text-ona-success"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2.2l1.6 1.8 2.4-.3.9 2.3 2.3.9-.1 2.5 1.7 1.8-1 2.3.8 2.4-2.1 1.4-.4 2.5-2.5.6-1.5 2-2.1-1.4-2.1 1.4-1.5-2-2.5-.6-.4-2.5-2.1-1.4.8-2.4-1-2.3 1.7-1.8-.1-2.5 2.3-.9.9-2.3 2.4.3z" />
              <polyline points="9 12 11.5 14.5 16 9.5" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-[24px] font-bold tracking-tight text-center mb-3 text-ona-ink">
            Tier 2 approved
          </h2>

          {/* Subtitle */}
          <p className="text-[14px] leading-relaxed text-center max-w-sm mx-auto mb-8 text-ona-muted">
            Your ID was submitted and approved by admin / customer care. You can
            book without the free-period limit.
          </p>

          {/* Perks Grid */}
          <div className="grid grid-cols-2 gap-8 w-full max-w-xs mx-auto mb-8">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-5 w-5 text-ona-success mb-2" strokeWidth={2.4} />
              <span className="text-[13px] font-medium leading-tight text-ona-ink">
                Verified identity
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <Calendar className="h-5 w-5 text-ona-success mb-2" strokeWidth={2.4} />
              <span className="text-[13px] font-medium leading-tight text-ona-ink">
                Unlimited booking
              </span>
            </div>
          </div>

          {/* Back Home Button */}
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="w-full rounded-ona-ctl bg-brand hover:opacity-90 text-white py-4 text-[15px] font-bold transition-all shadow-sm active:scale-[0.99] cursor-pointer"
          >
            Back home
          </button>
        </div>

        {/* Bottom Section */}
        <div className="pt-5 border-t border-ona-border">
          {/* Header */}
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-ona-muted mb-3">
            VERIFICATION
          </h3>

          {/* Next Tier Info */}
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[12px] font-bold">
              Tier 2
            </span>
            <span className="text-[13px] font-normal text-ona-muted">
              Next: In-person mark
            </span>
          </div>

          {/* 3-segment Progress Bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1.5 flex-1 rounded-full bg-brand" />
            <div className="h-1.5 flex-1 rounded-full bg-brand" />
            <div className="h-1.5 flex-1 rounded-full bg-ona-field-strong" />
          </div>

          {/* Continue verification link */}
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="inline-flex items-center gap-1 text-[14px] font-bold transition-colors hover:underline cursor-pointer text-ona-ink"
          >
            <span>Continue verification</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
