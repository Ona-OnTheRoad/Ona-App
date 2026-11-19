"use client";

import { ArrowLeft } from "lucide-react";
import { NavMenuButton } from "@/components/layout/nav-slider/nav-menu-button";

interface PaymentsScreenHeaderProps {
  title: string;
  onBack: () => void;
  className?: string;
  rightAction?: React.ReactNode;
  /** Show the navigation-slider button (navigation destinations only). */
  showMenu?: boolean;
}

export function PaymentsScreenHeader({
  title,
  onBack,
  className,
  rightAction,
  showMenu = false,
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
        {rightAction ? (
          <div>{rightAction}</div>
        ) : showMenu ? (
          <NavMenuButton />
        ) : null}
      </div>

      {/* Screen Title */}
      <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">
        {title}
      </h1>
    </div>
  );
}
