"use client";

import { DATE_CHIPS, type DateFilter } from "./activity-filters";

interface ActivityTimeChipsProps {
  activeChip: DateFilter;
  onChange: (chip: DateFilter) => void;
}

export function ActivityTimeChips({
  activeChip,
  onChange,
}: ActivityTimeChipsProps) {
  return (
    <div
      className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide py-3"
      role="tablist"
      aria-label="Time period filter"
    >
      {DATE_CHIPS.map(({ key, label }) => {
        const isActive = activeChip === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={`shrink-0 px-2.5 py-1.5 text-[12px] font-semibold tracking-wide transition-colors rounded-ona-ctl cursor-pointer ${
              isActive
                ? "bg-ona-field text-ona-ink font-medium"
                : "text-ona-muted hover:text-ona-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
