"use client";

import { ArrowLeft } from "lucide-react";

interface PaymentsScreenHeaderProps {
  title: string;
  onBack: () => void;
  className?: string;
  rightAction?: React.ReactNode;
}

export function PaymentsScreenHeader({
  title,
  onBack,
  className,
  rightAction,
}: PaymentsScreenHeaderProps) {
  return (
    <div className={`pt-3 pb-1 mb-2 ${className || ""}`}>
      {/* Top row with back arrow and optional right action */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 active:opacity-70"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
        </button>
        {rightAction ? <div>{rightAction}</div> : null}
      </div>

      {/* Screen Title */}
      <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">
        {title}
      </h1>
    </div>
  );
}
