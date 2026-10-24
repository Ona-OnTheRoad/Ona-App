"use client";

import { useMemo } from "react";
import Image from "next/image";

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
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-11 w-11 shrink-0">
          <div className="h-full w-full overflow-hidden rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* Active status indicator dot at top-right of avatar */}
          <span className="absolute -top-0.5 right-0 h-3 w-3 rounded-full bg-[#15803D] ring-2 ring-white dark:ring-[#121316]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
            {greeting}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
            {name}
          </p>
        </div>
      </div>

      <div
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border shadow-xs transition-colors ${
          proLive
            ? "border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-slate-900 text-[#10B981]"
            : "border-red-200 dark:border-red-900/40 bg-white dark:bg-slate-900 text-[#EF4444]"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            proLive ? "bg-[#10B981]" : "bg-[#EF4444]"
          }`}
        />
        {proLive ? "Online" : "Offline"}
      </div>
    </div>
  );
}
