"use client";

import { ArrowLeft } from "lucide-react";

interface Tier2UploadHeaderProps {
  onBack: () => void;
  isLight?: boolean;
}

export function Tier2UploadHeader({ onBack }: Tier2UploadHeaderProps) {
  return (
    <>
      {/* Top Back bar */}
      <div className="flex items-center pt-3 pb-1 mb-2">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 active:opacity-70"
          aria-label="Back to Verification"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>
      </div>

      {/* Screen Title */}
      <h1 className="text-[20px] font-semibold tracking-tight mb-1 text-ona-ink">
        Tier 2 . Government ID
      </h1>
      <p className="text-[14px] mb-6 leading-normal text-ona-muted">
        Upload a clear government ID for Care review
      </p>
    </>
  );
}
