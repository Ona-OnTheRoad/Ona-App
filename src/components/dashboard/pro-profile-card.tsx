"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarInitials } from "@/lib/brand";

interface ProProfileCardProps {
  displayName?: string | null;
  avatarUrl?: string | null;
  proLive?: boolean;
}

export function ProProfileCard({
  displayName,
  avatarUrl,
  proLive = false,
}: ProProfileCardProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const name = displayName?.trim() || "Repair Pro";
  const validAvatarUrl = avatarUrl?.trim() || undefined;

  return (
    <div className="flex items-center justify-between py-1 dark:rounded-2xl dark:bg-ona-surface dark:px-3.5 dark:py-3 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-11 w-11 shrink-0">
          <Avatar className="h-full w-full overflow-hidden rounded-full border border-slate-200 dark:border-ona-border shadow-sm">
            {validAvatarUrl ? (
              <AvatarImage
                src={validAvatarUrl}
                alt={name}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-brand dark:bg-ona-brand text-sm font-bold text-white">
              {avatarInitials(displayName, "PR")}
            </AvatarFallback>
          </Avatar>
          {/* Active status indicator dot at top-right of avatar */}
          <span className="absolute -top-0.5 right-0 h-3 w-3 dark:h-3.5 dark:w-3.5 rounded-full bg-[#15803D] dark:bg-ona-success ring-2 ring-white dark:ring-0" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold dark:font-medium text-slate-900 dark:text-ona-ink leading-tight">
            {greeting}
          </p>
          <p className="truncate text-xs dark:text-[13px] text-slate-500 dark:text-ona-muted font-normal leading-tight mt-0.5">
            {name}
          </p>
        </div>
      </div>

      <div
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border shadow-xs dark:shadow-none transition-colors ${
          proLive
            ? "border-emerald-200 dark:border-transparent bg-white text-[#10B981] dark:text-ona-success"
            : "border-transparent bg-ona-brand-soft dark:bg-white text-[#EF4444] dark:text-ona-danger"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            proLive ? "bg-[#10B981] dark:bg-ona-success" : "bg-[#EF4444] dark:bg-ona-danger"
          }`}
        />
        {proLive ? "Online" : "Offline"}
      </div>
    </div>
  );
}
