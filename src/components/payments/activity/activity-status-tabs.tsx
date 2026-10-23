"use client";

import type { StatusFilter } from "./activity-filters";

export interface StatusTabOption {
  key: StatusFilter;
  label: string;
}

interface ActivityStatusTabsProps {
  tabs: StatusTabOption[];
  activeTab: StatusFilter;
  onChange: (tab: StatusFilter) => void;
}

export function ActivityStatusTabs({
  tabs,
  activeTab,
  onChange,
}: ActivityStatusTabsProps) {
  return (
    <div
      className="flex w-full border-b border-ona-border"
      role="tablist"
      aria-label="Activity status filter"
    >
      {tabs.map(({ key, label }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={`relative flex-1 py-3 text-center text-[12px] font-medium transition-colors cursor-pointer ${
              isActive
                ? "text-brand"
                : "text-ona-muted hover:text-ona-ink"
            }`}
          >
            {label}
            {isActive ? (
              <span
                className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-brand"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
