"use client";

import { useState } from "react";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { cn } from "@/lib/utils";
import type { AdminRow, FetchSection } from "./types";

const AUDIT_FILTERS = [
  { key: "all", label: "All" },
  { key: "approve-contact-change", label: "Contact Changes" },
  { key: "approve-referral", label: "Referrals" },
  { key: "approve-cashout", label: "Cashouts" },
];

export function AuditTab({
  actions,
  fetchSection,
}: {
  actions: AdminRow[];
  fetchSection: FetchSection;
}) {
  const [activeFilter, setActiveFilter] = useState("all");

  const handleFilterClick = (key: string) => {
    setActiveFilter(key);
    void fetchSection("audit", key === "all" ? "" : `actionType=${key}`);
  };

  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[480px] flex flex-col">
      {/* Card Header & Filter Subtabs */}
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          Audit Trail
        </h2>

        {/* Filter Subtabs */}
        <div className="flex items-center gap-6 mt-4 border-b border-gray-100 dark:border-[#27272a]/60 text-xs">
          {AUDIT_FILTERS.map((s) => {
            const isActive = activeFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => handleFilterClick(s.key)}
                className={cn(
                  "pb-2 font-semibold transition-colors cursor-pointer relative",
                  isActive
                    ? "text-ona-brand border-b-2 border-ona-brand"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table / Empty State */}
      {actions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No audit entries
          </h3>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px] border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold">Admin</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 pl-4 pr-6 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {actions.map((a) => (
                <tr
                  key={String(a.id)}
                  className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-4 font-medium text-gray-900 dark:text-white">
                    {a.adminName || String(a.adminId ?? "").slice(0, 8)}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                    {a.actionType}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                    {a.targetType}:{String(a.targetId ?? "").slice(0, 8)}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {a.reason || "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize",
                        a.status === "completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
                      )}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-right text-gray-400 dark:text-gray-500 text-[11px]">
                    {new Date(String(a.createdAt ?? "")).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
