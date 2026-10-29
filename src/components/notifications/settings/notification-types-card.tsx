"use client";

import { CATEGORY_ROWS } from "./rows";
import { PrefRow } from "./pref-row";
import type { NotificationCategoryPref } from "./types";

interface NotificationTypesCardProps {
  categories: NotificationCategoryPref;
  enabled: boolean;
  onToggle: (key: keyof NotificationCategoryPref, val: boolean) => void;
}

export function NotificationTypesCard({
  categories,
  enabled,
  onToggle,
}: NotificationTypesCardProps) {
  return (
    <div className="rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4 shadow-xs">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted mb-1">
        TYPES
      </p>

      <div className="divide-y divide-ona-border dark:divide-[#18181B]">
        {CATEGORY_ROWS.map((row) => (
          <PrefRow
            key={row.key}
            label={row.label}
            detail={row.detail}
            checked={categories[row.key]}
            disabled={!enabled}
            onChange={(val) => onToggle(row.key, val)}
          />
        ))}
      </div>
    </div>
  );
}
