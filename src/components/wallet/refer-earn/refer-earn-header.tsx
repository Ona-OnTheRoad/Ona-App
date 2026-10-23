"use client";

import { ArrowLeft } from "lucide-react";

interface ReferEarnHeaderProps {
  onBack: () => void;
  isLight?: boolean;
}

export function ReferEarnHeader({ onBack }: ReferEarnHeaderProps) {
  return (
    <div className="pt-3 pb-1 mb-2">
      {/* Back button */}
      <div className="flex items-center mb-2">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 active:opacity-70"
          aria-label="Back to Profile"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>
      </div>

      {/* Screen Title */}
      <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">
        Refer & Earn
      </h1>
    </div>
  );
}
