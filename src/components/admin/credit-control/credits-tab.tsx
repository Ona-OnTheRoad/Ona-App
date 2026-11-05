"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { cn } from "@/lib/utils";
import type { AdminRow, OnAction } from "./types";

export function CreditsTab({
  txs,
  onAction,
}: {
  txs: AdminRow[];
  onAction: OnAction;
}) {
  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[480px] flex flex-col">
      {/* Card Header */}
      <div className="px-6 pt-5 pb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          Credits
        </h2>
      </div>

      {/* Table / Empty State */}
      {txs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No transactions
          </h3>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px] border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 pl-4 pr-6 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {txs.map((tx) => (
                <tr
                  key={String(tx.id)}
                  className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-4 font-medium text-gray-900 dark:text-white">
                    {String(tx.userId ?? "").slice(0, 8)}
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300 capitalize">
                    {String(tx.transactionType ?? "").replace(/_/g, " ")}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                    ₦{Number(tx.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize",
                        tx.status === "completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
                      )}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-right text-gray-500 dark:text-gray-400 text-[11px]">
                    {new Date(String(tx.createdAt ?? "")).toLocaleDateString()}
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
