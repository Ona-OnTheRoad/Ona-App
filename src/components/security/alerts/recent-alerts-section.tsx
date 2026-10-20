"use client";

import { Bell } from "lucide-react";
import type { AlertItem } from "@/components/settings-pages/security-alerts/security-alerts-data";

interface RecentAlertsSectionProps {
  feed: AlertItem[];
  onMarkAllRead: () => void;
}

function formatAlertDate(isoString: string) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return `${d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  })}, ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })}`;
}

export function RecentAlertsSection({
  feed,
  onMarkAllRead,
}: RecentAlertsSectionProps) {
  const unreadCount = feed.filter((a) => !a.read).length;

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted">
          Recent alerts
        </p>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[12px] font-bold text-brand underline hover:opacity-80 transition-opacity cursor-pointer border-0 bg-transparent p-0"
          >
            Mark all as read
          </button>
        ) : null}
      </div>

      {feed.length === 0 ? (
        <p className="px-1 py-4 text-[13px] text-ona-muted">
          No security alerts yet.
        </p>
      ) : (
        <div className="divide-y divide-ona-border">
          {feed.map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-3 py-3 transition-opacity ${
                a.read ? "opacity-60" : "opacity-100"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ona-ctl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-500 mt-0.5">
                <Bell className="h-4.5 w-4.5" strokeWidth={2} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-ona-ink">
                  {a.title}
                </p>
                <p className="text-[12px] font-medium text-ona-muted mt-0.5 leading-snug">
                  {a.body}
                </p>
                <p className="text-[11px] font-medium text-ona-muted mt-1">
                  {formatAlertDate(a.at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
