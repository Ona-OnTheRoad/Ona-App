"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import type { Detail } from "./types";

export function CustomerBookingsTab({ bookings }: { bookings: Detail["bookings"] }) {
  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[480px] flex flex-col">
      {/* Card Header */}
      <div className="px-6 pt-5 pb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          Bookings
        </h2>
      </div>

      {/* Table / Empty State */}
      {bookings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No bookings yet.
          </h3>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px] border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold">When</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 pl-4 pr-6 font-semibold">Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-4 font-mono text-gray-500 dark:text-gray-400">
                    {new Date(b.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white capitalize">
                    {b.status || "—"}
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-gray-600 dark:text-gray-300 font-mono">
                    {b.scheduled_at
                      ? new Date(b.scheduled_at).toLocaleString()
                      : "—"}
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

