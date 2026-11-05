"use client";

import Link from "next/link";
import type { Board, DashboardTotals } from "./types";

interface DashboardMetricsProps {
  dash: DashboardTotals | null;
  board: Board | null;
}

export function DashboardMetrics({ dash, board }: DashboardMetricsProps) {
  // If dash is loading or not yet available, render skeleton cards
  if (!dash) {
    const skeletonLabels = [
      "USERS",
      "CUSTOMERS",
      "REPAIR PROS",
      "PENDING PROS",
      "OPEN JOBS",
      "COMPLETED",
      "REVENUE (N)",
      "DISPUTES",
    ];

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {skeletonLabels.map((label) => (
          <div
            key={label}
            className="block bg-[#f8f9fa] dark:bg-[#18171c] border border-[#eaecf0] dark:border-[#27272a] rounded-xl p-3 sm:p-4"
          >
            <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase select-none">
              {label}
            </div>
            <div className="h-7 w-20 bg-gray-200 dark:bg-[#27272a] rounded-md animate-pulse mt-1" />
          </div>
        ))}
      </div>
    );
  }

  // Format real dynamic numbers cleanly
  const formatValue = (
    val: number | undefined | null,
    isCurrency = false,
  ) => {
    if (val == null) return isCurrency ? "₦0" : "0";
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(0)}B+`;
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(0)}M+`;
    }
    if (isCurrency) {
      return `₦${val.toLocaleString()}`;
    }
    return val.toLocaleString();
  };

  const metrics = [
    {
      label: "USERS",
      value: formatValue(dash.users),
      href: "/admin/users",
    },
    {
      label: "CUSTOMERS",
      value: formatValue(dash.motorists),
      href: "/admin/motorists",
    },
    {
      label: "REPAIR PROS",
      value: formatValue(dash.repairPros),
      href: "/admin/pros",
    },
    {
      label: "PENDING PROS",
      value: formatValue(dash.pendingPros),
      href: "/admin/pros",
    },
    {
      label: "OPEN JOBS",
      value: formatValue(dash.openJobs ?? board?.jobs?.length ?? 0),
      href: "/admin/jobs",
    },
    {
      label: "COMPLETED",
      value: formatValue(dash.completedJobs),
      href: "/admin/jobs",
    },
    {
      label: "REVENUE (N)",
      value: formatValue(dash.revenueNgn, true),
      href: "/admin/payments/control-center",
    },
    {
      label: "DISPUTES",
      value: (board?.disputedCount ?? 0).toLocaleString(),
      href: "/admin/disputes",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
      {metrics.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="group block bg-[#f8f9fa] dark:bg-[#18171c] border border-[#eaecf0] dark:border-[#27272a] rounded-xl p-3 sm:p-4 hover:border-gray-300 dark:hover:border-[#383842] transition-colors"
        >
          <div className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase select-none">
            {item.label}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight group-hover:text-ona-brand dark:group-hover:text-ona-brand transition-colors">
            {item.value}
          </div>
        </Link>
      ))}
    </div>
  );
}
