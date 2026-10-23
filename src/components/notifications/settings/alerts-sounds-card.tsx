"use client";

import { OnaToggle } from "@/components/ui/ona-toggle";

interface AlertsSoundsCardProps {
  userName: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}

export function AlertsSoundsCard({
  userName,
  enabled,
  onChange,
}: AlertsSoundsCardProps) {
  return (
    <div className="rounded-ona-card border border-ona-border bg-ona-surface p-4 shadow-xs space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted">
        ALERTS & SOUNDS
      </p>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[12px] font-medium text-ona-ink">
            Notification preferences
          </p>
          <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
            Alerts for {userName}
          </p>
        </div>
        <OnaToggle
          checked={enabled}
          onChange={onChange}
          label="Notification preferences"
        />
      </div>
    </div>
  );
}
