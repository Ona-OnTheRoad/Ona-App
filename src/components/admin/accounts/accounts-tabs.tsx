"use client";

import { cn } from "@/lib/utils";

export type AccountsTab = "duplicates" | "sync_events";

interface AccountsTabsProps {
  currentTab: AccountsTab;
  onTabChange: (tab: AccountsTab) => void;
}

export function AccountsTabs({ currentTab, onTabChange }: AccountsTabsProps) {
  const tabs: { id: AccountsTab; label: string }[] = [
    { id: "duplicates", label: "Duplicate identities" },
    { id: "sync_events", label: "Recent identity sync" },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-[#18171c] border border-gray-200/80 dark:border-[#27272a] rounded-xl w-fit max-w-full overflow-x-auto mb-6 select-none">
      {tabs.map((tab) => {
        const active = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
              active
                ? "bg-white dark:bg-[#27272a] text-ona-brand font-semibold shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-[#202026]",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

