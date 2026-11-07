"use client";

import { useMemo, useState } from "react";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { JobsPagination } from "@/components/admin/jobs/jobs-pagination";
import { fmt, type SyncEvent } from "./types";

interface SyncEventsTabProps {
  events: SyncEvent[];
}

const ITEMS_PER_PAGE = 10;

export function SyncEventsTab({ events }: SyncEventsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(events.length / ITEMS_PER_PAGE));
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return events.slice(start, start + ITEMS_PER_PAGE);
  }, [events, currentPage]);

  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[480px] flex flex-col">
      {/* Header Toolbar */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none flex items-center gap-2">
          <span>Recent identity sync events</span>
          {events.length > 0 ? (
            <span className="text-ona-brand font-bold">
              {events.length.toLocaleString()}
            </span>
          ) : null}
        </h2>
      </div>

      {/* Table / Empty State */}
      {events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No sync events yet.
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm leading-relaxed">
            Identity reconciliation and role synchronization actions will be logged here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px] border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold w-[24%]">When</th>
                <th className="py-3 px-4 font-semibold w-[42%]">User</th>
                <th className="py-3 px-4 font-semibold w-[22%]">Action</th>
                <th className="py-3 pl-4 pr-6 font-semibold w-[12%]">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {paginatedEvents.map((e) => (
                <tr
                  key={e.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-4 font-mono text-gray-500 dark:text-gray-400 text-xs">
                    {fmt(e.created_at)}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300 text-xs select-all">
                    {e.user_id ? (
                      <a
                        href={`/admin/motorists/${e.user_id}`}
                        className="hover:text-ona-brand transition-colors"
                      >
                        {e.user_id}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-gray-900 dark:text-white font-medium capitalize text-xs">
                    {e.action ? e.action.replace(/_/g, " ") : "—"}
                  </td>

                  <td className="py-3.5 pl-4 pr-6">
                    <span
                      className={`inline-flex items-center text-xs font-semibold capitalize ${
                        e.result === "error" || e.result === "failed"
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {e.result === "ok" ? "Ok" : e.result}
                    </span>
                    {e.error ? (
                      <div className="font-mono text-[10px] text-red-500 dark:text-red-400 mt-0.5">
                        {e.error}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <JobsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

