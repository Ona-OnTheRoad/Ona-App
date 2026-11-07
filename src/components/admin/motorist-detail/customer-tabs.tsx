"use client";

import { cn } from "@/lib/utils";

export type CustomerDetailTab =
  | "profile"
  | "jobs"
  | "bookings"
  | "payments"
  | "sync";

export const CUSTOMER_DETAIL_TABS: { key: CustomerDetailTab; label: string }[] =
  [
    { key: "profile", label: "Profile & Vehicles" },
    { key: "jobs", label: "Jobs & Service Requests" },
    { key: "bookings", label: "Bookings" },
    { key: "payments", label: "Payments" },
    { key: "sync", label: "Account & Sync" },
  ];

interface CustomerTabsProps {
  currentTab: CustomerDetailTab;
  onTabChange: (tab: CustomerDetailTab) => void;
}

export function CustomerTabs({
  currentTab,
  onTabChange,
}: CustomerTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] mb-6 shadow-xs select-none flex-wrap">
      {CUSTOMER_DETAIL_TABS.map((t) => {
        const isActive = currentTab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
              isActive
                ? "text-ona-brand bg-gray-50 dark:bg-[#222129] shadow-xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-[#1e1d23]",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

