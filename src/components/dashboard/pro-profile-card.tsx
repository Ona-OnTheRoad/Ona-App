"use client";

import { useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

  return (
    <div className="flex items-center justify-between rounded-2xl border border-ona-border bg-ona-surface px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-ona-border bg-ona-field">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[15px] font-bold text-ona-muted">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-ona-muted leading-tight">
            {greeting}
          </p>
          <p className="truncate text-[15px] font-bold text-ona-ink leading-snug">
            {name}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
          proLive
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "border border-ona-border bg-ona-field text-ona-muted",
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            proLive ? "bg-emerald-500" : "bg-ona-muted",
          )}
        />
        {proLive ? "Online" : "Offline"}
      </div>
    </div>
  );
}
