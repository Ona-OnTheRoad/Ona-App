"use client";

import type { Board } from "./types";

interface DashboardLiveOpsProps {
  board: Board | null;
}

export function DashboardLiveOps({ board }: DashboardLiveOpsProps) {
  const items = [
    {
      label: "LIVE BOARD",
      value: (board?.jobs?.length ?? 0).toString(),
    },
    {
      label: "APPEALS",
      value: (board?.appealCount ?? 0).toString(),
    },
    {
      label: "EN ROUTE",
      value: board?.byStatus?.en_route != null ? board.byStatus.en_route.toString() : "---",
    },
    {
      label: "IN PROGRESS",
      value: board?.byStatus?.in_progress != null ? board.byStatus.in_progress.toString() : "---",
    },
    {
      label: "PAID/BOOKED",
      value: board?.byStatus?.paid_booked != null ? board.byStatus.paid_booked.toString() : "---",
    },
    {
      label: "NEGOTIATING",
      value: board?.byStatus?.negotiating != null ? board.byStatus.negotiating.toString() : "---",
    },
  ];

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#18171c] border border-[#eaecf0] dark:border-[#27272a] rounded-2xl p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Live ops
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="bg-white dark:bg-[#121116] border border-[#eaecf0] dark:border-[#27272a] rounded-xl p-2.5 sm:p-3"
          >
            <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase select-none">
              {item.label}
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5 tracking-tight">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

