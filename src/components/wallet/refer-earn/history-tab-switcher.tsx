"use client";

import { cn } from "@/lib/utils";

export type HistoryTab = "referral" | "cashout";

interface HistoryTabSwitcherProps {
  activeTab: HistoryTab;
  onTabChange: (tab: HistoryTab) => void;
  isLight?: boolean;
}

export function HistoryTabSwitcher({
  activeTab,
  onTabChange,
}: HistoryTabSwitcherProps) {
  return (
    <div className="flex items-center rounded-full p-1 gap-1 transition-colors bg-ona-field-strong">
      <button
        type="button"
        onClick={() => onTabChange("referral")}
        className={cn(
          "flex-1 py-2.5 px-3 rounded-full text-[12px] font-medium transition-all text-center",
          activeTab === "referral"
            ? "bg-ona-surface text-ona-ink shadow-xs"
            : "text-ona-muted hover:text-ona-ink",
        )}
      >
        Referral history
      </button>

      <button
        type="button"
        onClick={() => onTabChange("cashout")}
        className={cn(
          "flex-1 py-2.5 px-3 rounded-full text-[12px] font-medium transition-all text-center",
          activeTab === "cashout"
            ? "bg-ona-surface text-ona-ink shadow-xs"
            : "text-ona-muted hover:text-ona-ink",
        )}
      >
        Cash out history
      </button>
    </div>
  );
}
