"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { JobsPagination } from "@/components/admin/jobs/jobs-pagination";
import { ChevronDown, RefreshCw, Check } from "lucide-react";

export type SignupEventRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  account_type: string | null;
  success: boolean;
  error_message: string | null;
  user_id: string | null;
  created_at: string;
};

export type SignupStatusFilter = "all" | "saved" | "failed";

interface SignupsTableProps {
  events: SignupEventRow[];
  statusFilter: SignupStatusFilter;
  onStatusFilterChange: (filter: SignupStatusFilter) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

const PAGE_SIZE = 10;

export function SignupsTable({
  events,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  refreshing = false,
}: SignupsTableProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (statusFilter === "saved") {
      return events.filter((e) => e.success);
    }
    if (statusFilter === "failed") {
      return events.filter((e) => !e.success);
    }
    return events;
  }, [events, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const currentEvents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, currentPage]);

  const filterLabel =
    statusFilter === "saved"
      ? "Saved"
      : statusFilter === "failed"
      ? "Failed"
      : "Status";

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          All Signups
        </h2>

        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span>{filterLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1a24] shadow-lg py-1 z-20 text-xs">
                {(
                  [
                    { key: "all", label: "All status" },
                    { key: "saved", label: "Saved" },
                    { key: "failed", label: "Failed" },
                  ] as const
                ).map((opt) => {
                  const isSelected = statusFilter === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        onStatusFilterChange(opt.key);
                        setCurrentPage(1);
                        setFilterOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-ona-brand" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-y border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <th className="px-6 py-3.5">When</th>
              <th className="px-6 py-3.5">Name/ Email</th>
              <th className="px-6 py-3.5">Contact</th>
              <th className="px-6 py-3.5">Type</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Error / Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <NoHistoryIllustration className="w-52 h-40 max-w-full" />
                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                      No signup events yet.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentEvents.map((e) => {
                const normType = (e.account_type || "").toLowerCase();
                const isPro = normType.includes("pro") || normType.includes("repair");
                const isAdmin = normType.includes("admin");

                return (
                  <tr
                    key={e.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {e.created_at
                        ? new Date(e.created_at).toLocaleString()
                        : "—"}
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {e.full_name || "—"}
                      </div>
                      <div className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5">
                        {e.email || "—"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {e.phone || "—"}
                    </td>

                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isAdmin
                              ? "bg-red-500"
                              : isPro
                              ? "bg-emerald-500"
                              : "bg-gray-400 dark:bg-white"
                          }`}
                        />
                        <span className="capitalize">
                          {isAdmin
                            ? "Admin"
                            : isPro
                            ? "Repair pro"
                            : "Motorist"}
                        </span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                          e.success
                            ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-500 dark:bg-red-500/20"
                        }`}
                      >
                        {e.success ? "Saved" : "Failed"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {e.success
                        ? e.user_id
                          ? `user ${e.user_id.slice(0, 8)}…`
                          : "ok"
                        : e.error_message || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredEvents.length > PAGE_SIZE && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
          <JobsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

