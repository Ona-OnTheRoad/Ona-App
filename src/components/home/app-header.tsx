"use client";

import Link from "next/link";
import { Bell, LocateFixed, MapPin } from "lucide-react";
import { useNotificationsOptional } from "@/components/notifications/notification-provider";
import { useApp } from "@/lib/store";

/** Floating location pill over the map with notification bell placed beside it. */
export function AppHeader() {
  const { location, retryLocation } = useApp();
  const notif = useNotificationsOptional();
  const unreadCount = notif?.unreadCount ?? 0;

  return (
    <header className="flex shrink-0 items-center gap-2.5 px-4 pb-1 pt-4">
      <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-ona-border bg-ona-surface pl-3.5 pr-1.5 shadow-sm">
        <MapPin
          aria-hidden
          className="h-4 w-4 shrink-0 text-ona-muted"
          strokeWidth={2}
        />
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-ona-ink">
          {location.label || "Yaba, Lagos"}
        </p>
        <button
          type="button"
          onClick={retryLocation}
          aria-label="Use my current location"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-ona-muted transition-colors hover:text-ona-ink cursor-pointer"
        >
          <LocateFixed className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <Link
        href="/notifications"
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ona-border bg-ona-surface text-ona-ink shadow-sm transition-colors hover:bg-ona-field cursor-pointer"
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#FF6B35] ring-2 ring-ona-surface" />
        ) : null}
      </Link>
    </header>
  );
}
