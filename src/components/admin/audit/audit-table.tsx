"use client";

import { useState, useRef, useEffect } from "react";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { ChevronDown, Check } from "lucide-react";

export type AuditActionRow = {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
};

export type AuditPeriod = "all" | "year" | "ytd";

const PERIOD_LABELS: Record<AuditPeriod, string> = {
  all: "All time",
  year: "Past year",
  ytd: "Year to date",
};

interface AuditTableProps {
  actions: AuditActionRow[];
  period: AuditPeriod;
  onPeriodChange: (p: AuditPeriod) => void;
  ytdCount?: number;
}

export function AuditTable({
  actions,
  period,
  onPeriodChange,
  ytdCount = 0,
}: AuditTableProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Audit trail • {actions.length}
        </h2>

        {/* Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span>
              {period === "all" ? "Filter" : PERIOD_LABELS[period]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1a24] shadow-lg py-1 z-20 text-xs">
              {(["all", "year", "ytd"] as AuditPeriod[]).map((p) => {
                const isSelected = period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onPeriodChange(p);
                      setFilterOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span>
                      {PERIOD_LABELS[p]}
                      {p === "ytd" && ytdCount > 0 ? ` (${ytdCount})` : ""}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-ona-brand" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-y border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <th className="px-6 py-3.5">When</th>
              <th className="px-6 py-3.5">Actions</th>
              <th className="px-6 py-3.5">Admin</th>
              <th className="px-6 py-3.5">Target</th>
              <th className="px-6 py-3.5">Meta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {actions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <NoHistoryIllustration className="w-52 h-40 max-w-full" />
                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                      No admin actions recorded yet.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              actions.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-900 dark:text-white">
                    {a.action}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {a.admin_id.slice(0, 8)}…
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {a.target_user_id ? `${a.target_user_id.slice(0, 8)}…` : "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {Object.keys(a.meta || {}).length
                      ? JSON.stringify(a.meta)
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

