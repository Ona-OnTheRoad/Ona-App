"use client";

import { DELIVERY_ROWS } from "./rows";
import { PrefRow } from "./pref-row";
import type { NotificationDeliveryPref } from "./types";

interface NotificationDeliveryCardProps {
  delivery: NotificationDeliveryPref;
  enabled: boolean;
  onToggle: (key: keyof NotificationDeliveryPref, val: boolean) => void;
}

export function NotificationDeliveryCard({
  delivery,
  enabled,
  onToggle,
}: NotificationDeliveryCardProps) {
  return (
    <div className="rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4 shadow-xs">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted mb-1">
        DELIVERY
      </p>

      <div className="divide-y divide-ona-border dark:divide-[#18181B]">
        {DELIVERY_ROWS.map((row) => (
          <PrefRow
            key={row.key}
            label={row.label}
            detail={row.detail}
            checked={delivery[row.key]}
            disabled={!enabled}
            onChange={(val) => onToggle(row.key, val)}
          />
        ))}
      </div>
    </div>
  );
}
