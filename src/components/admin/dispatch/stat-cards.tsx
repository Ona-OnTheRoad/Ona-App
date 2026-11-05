"use client";

import type { Summary } from "./types";

interface DispatchStatCardsProps {
  summary: Summary | null;
}

export function DispatchStatCards({ summary }: DispatchStatCardsProps) {
  const cards = [
    {
      label: "SEARCHING",
      value: (summary?.searching ?? 0).toString(),
      subtext: "awaiting a pro",
    },
    {
      label: "PAIRING",
      value: (summary?.pairing ?? 0).toString(),
      subtext: "66s dispatch",
    },
    {
      label: "NEGOTIATING",
      value: (summary?.negotiating ?? 0).toString(),
      subtext: "pro has the request",
    },
    {
      label: "AGREED",
      value: (summary?.agreed ?? 0).toString(),
      subtext: "price agreed",
    },
    {
      label: "DEFERRED",
      value: (summary?.activeDeferrals ?? 0).toString(),
      subtext: 'pro "Later" (5 min)',
    },
    {
      label: "EXCLUDED",
      value: (
        (summary?.activeExclusions ?? 0) + (summary?.crossJobExclusions ?? 0)
      ).toString(),
      subtext: `declined (per-request) · ${summary?.crossJobExclusions ?? 0} cross-job`,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 w-full">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-[#f8f9fa] dark:bg-[#18171c] border border-[#eaecf0] dark:border-[#27272a] rounded-xl p-3 sm:p-4 hover:border-gray-300 dark:hover:border-[#383842] transition-colors"
        >
          <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase select-none">
            {c.label}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">
            {c.value}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate" title={c.subtext}>
            {c.subtext}
          </div>
        </div>
      ))}
    </div>
  );
}
