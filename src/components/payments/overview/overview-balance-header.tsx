"use client";

import { RefreshCw } from "lucide-react";

interface OverviewBalanceHeaderProps {
  label: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function OverviewBalanceHeader({
  label,
  isRefreshing,
  onRefresh,
}: OverviewBalanceHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 mb-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted">
        {label}
      </p>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1.5 border-0 bg-transparent py-1 text-[12px] font-bold text-ona-ink hover:opacity-75 active:opacity-60 transition-opacity cursor-pointer disabled:opacity-50"
        aria-label="Refresh balance"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          strokeWidth={2.25}
        />
        <span>Refresh</span>
      </button>
    </div>
  );
}
