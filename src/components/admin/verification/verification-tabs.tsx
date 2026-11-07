"use client";

import { cn } from "@/lib/utils";
import { UserCheck, Wrench, BarChart2 } from "lucide-react";

export type VerificationTabKey = "customer_id" | "pro_id" | "overview";

interface VerificationTabsProps {
  activeTab: VerificationTabKey;
  onTabChange: (tab: VerificationTabKey) => void;
  customerPending?: number;
  proPending?: number;
}

export function VerificationTabs({
  activeTab,
  onTabChange,
  customerPending = 0,
  proPending = 0,
}: VerificationTabsProps) {
  const tabs = [
    {
      key: "customer_id" as VerificationTabKey,
      label: "Customer ID review",
      badge: customerPending,
      icon: UserCheck,
    },
    {
      key: "pro_id" as VerificationTabKey,
      label: "Pro ID review",
      badge: proPending,
      icon: Wrench,
    },
    {
      key: "overview" as VerificationTabKey,
      label: "Queue overview",
      icon: BarChart2,
    },
  ];

  return (
    <div className="w-full mb-6 border-b border-gray-200 dark:border-[#27272a] no-scrollbar overflow-x-auto">
      <nav className="flex space-x-6 min-w-max" aria-label="Verification Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "pb-3 pt-1 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer select-none",
                isActive
                  ? "border-ona-brand text-ona-brand"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700",
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && tab.badge > 0 ? (
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                    isActive
                      ? "bg-ona-brand-soft text-ona-brand dark:bg-ona-brand/20 dark:text-ona-brand"
                      : "bg-gray-100 dark:bg-[#27272a] text-gray-600 dark:text-gray-300",
                  )}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

