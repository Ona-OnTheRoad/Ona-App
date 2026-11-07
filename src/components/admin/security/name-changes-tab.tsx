"use client";

import { useState } from "react";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { cn } from "@/lib/utils";
import type { AdminRow, FetchSection, OnAction } from "./types";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "under_review", label: "Under review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export function NameChangesTab({
  nameRequests,
  fetchSection,
  onAction,
}: {
  nameRequests: AdminRow[];
  fetchSection: FetchSection;
  onAction: OnAction;
}) {
  const [activeFilter, setActiveFilter] = useState("pending");

  const handleFilterClick = (status: string) => {
    setActiveFilter(status);
    void fetchSection("name-changes", status === "all" ? "" : `status=${status}`);
  };

  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[480px] flex flex-col">
      {/* Card Header & Filter Subtabs */}
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          Name Changes
        </h2>

        {/* Filter Subtabs */}
        <div className="flex items-center gap-6 mt-4 border-b border-gray-100 dark:border-[#27272a]/60 text-xs">
          {STATUS_FILTERS.map((s) => {
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
      {nameRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No name changes
          </h3>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px] border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold">User ID</th>
                <th className="py-3 px-4 font-semibold">Current Name</th>
                <th className="py-3 px-4 font-semibold">Requested Name</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 pl-4 pr-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {nameRequests.map((r) => (
                <tr
                  key={String(r.id)}
                  className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-4 font-medium text-gray-900 dark:text-white">
                    {String(r.userId ?? "").slice(0, 8)}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                    {r.currentName}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                    {r.requestedName}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                    {r.reason || "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize",
                        r.status === "approved"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : r.status === "rejected"
                          ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                          : r.status === "under_review"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                          : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
                      )}
                    >
                      {String(r.status ?? "pending").replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onAction("approve-name-change", {
                            id: r.id,
                            reason: "Admin approved",
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAction("reject-name-change", {
                            id: r.id,
                            reason: "Admin rejected",
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAction("review-name-change", {
                            id: r.id,
                            reason: "Under review",
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#1f1e25] dark:hover:bg-[#282730] text-gray-800 dark:text-gray-200 text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Review
                      </button>
                    </div>
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
