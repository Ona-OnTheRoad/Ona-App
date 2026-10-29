"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/components/notifications/notification-provider";

interface ProDashboardHeaderProps {
  title?: string;
  trade?: string;
}

export function ProDashboardHeader({
  title = "Dashboard",
  trade = "Mechanic",
}: ProDashboardHeaderProps) {
  const { unreadCount } = useNotifications();

  return (
    <header className="flex shrink-0 items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-2.5">
        <h1 className="text-[20px] font-bold dark:font-semibold tracking-tight text-ona-ink">
          {title}
        </h1>
        {trade ? (
          <span className="rounded-full bg-ona-field px-2.5 py-0.5 text-[12px] font-medium text-ona-muted dark:hidden">
            {trade}
          </span>
        ) : null}
      </div>

      <Link
        href="/notifications"
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ona-border bg-ona-surface text-ona-ink shadow-sm transition-colors hover:bg-ona-field cursor-pointer"
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#FF6B35] dark:bg-ona-brand ring-2 ring-ona-surface" />
        ) : null}
      </Link>
    </header>
  );
}
