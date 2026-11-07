"use client";

import { cn } from "@/lib/utils";
import type { Tab } from "./types";

export const SECURITY_SECTIONS: { key: Tab; label: string }[] = [
  { key: "contact-changes", label: "Contact Changes" },
  { key: "name-changes", label: "Name Changes" },
  { key: "fraud", label: "Fraud Review" },
  { key: "audit", label: "Audit Trail" },
];

interface SecuritySectionTabsProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function SecuritySectionTabs({
  currentTab,
  onTabChange,
}: SecuritySectionTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] mb-6 shadow-xs select-none flex-wrap">
      {SECURITY_SECTIONS.map((t) => {
        const isActive = currentTab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              isActive
                ? "text-ona-brand bg-gray-50 dark:bg-[#222129] shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-[#1e1d23]",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

