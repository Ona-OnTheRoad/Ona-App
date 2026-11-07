"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { JobsPagination } from "@/components/admin/jobs/jobs-pagination";

export type ProItem = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string;
  trade: string;
  status: string;
  verified: boolean;
};

interface ProsTableProps {
  pros: ProItem[];
  totalCount: number;
  loading: boolean;
  failure?: boolean;
  onRefresh: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProsTable({
  pros,
  totalCount,
  loading,
  failure,
  onRefresh,
  currentPage,
  totalPages,
  onPageChange,
}: ProsTableProps) {
  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[480px] flex flex-col">
      {/* Header toolbar */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none flex items-center gap-2">
          <span>All Repair Pros</span>
          {totalCount > 0 ? (
            <span className="text-ona-brand font-bold">
              {totalCount.toLocaleString()}
            </span>
          ) : null}
        </h2>
        <button
          type="button"
          disabled={loading}
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table / Empty State / Loading State */}
      {loading && !failure && pros.length === 0 ? (
        <div
          role="status"
          className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4 text-gray-400 dark:text-gray-500 text-sm"
        >
          <Loader2 className="w-5 h-5 animate-spin text-ona-brand mb-3" />
          <span>Loading pros…</span>
        </div>
      ) : !failure && pros.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No pros found.
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-relaxed">
            Registered repair professional accounts will appear here.
          </p>
        </div>
      ) : !failure && pros.length > 0 ? (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px] border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold w-[26%]">
                  Name/ Email
                </th>
                <th className="py-3 px-4 font-semibold w-[18%]">Contact</th>
                <th className="py-3 px-4 font-semibold w-[18%]">Location</th>
                <th className="py-3 px-4 font-semibold w-[16%]">Trade</th>
                <th className="py-3 px-4 font-semibold w-[12%]">Status</th>
                <th className="py-3 pl-4 pr-6 font-semibold w-[10%]">
                  Verified
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {pros.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-4">
                    <div className="font-semibold text-gray-900 dark:text-white text-xs">
                      {p.full_name || "Unnamed pro"}
                    </div>
                    <div className="font-mono text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {p.email || "—"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300 text-xs">
                    {p.phone || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300 text-xs">
                    {p.location || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-gray-800 dark:text-gray-200 capitalize text-xs">
                    {p.trade || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-gray-800 dark:text-gray-200 capitalize text-xs">
                    {p.status || "—"}
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-gray-800 dark:text-gray-200 text-xs font-medium">
                    {p.verified ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <JobsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
