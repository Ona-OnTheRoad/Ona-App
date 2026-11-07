"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { cn } from "@/lib/utils";
import type { AdminRow, OnAction } from "./types";

export function CashoutsTab({
  cashoutList,
  onAction,
}: {
  cashoutList: AdminRow[];
  onAction: OnAction;
}) {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="w-full space-y-6">
      {/* Informative Dismissible Banner */}
      {showBanner && (
        <div className="p-4 sm:p-5 rounded-2xl border border-red-200/80 dark:border-red-900/60 bg-[#fff1f0] dark:bg-[#201014] text-xs leading-relaxed text-red-900 dark:text-red-200 relative shadow-xs">
          <button
            type="button"
            onClick={() => setShowBanner(false)}
            className="absolute top-4 right-4 text-red-400 hover:text-red-600 dark:hover:text-red-200 cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 font-bold text-red-900 dark:text-red-100 text-xs">
            <Info className="w-4 h-4 text-red-500 shrink-0" />
            <span>How cashouts work</span>
          </div>
          <p className="mt-2 text-[11px] sm:text-xs text-red-800/90 dark:text-red-300/90 leading-relaxed pr-6">
            Approve starts an automatic Flutterwave bank transfer to the user&apos;s verified bank, no manual payment needed. Watch the Status column: processing means the transfer is retrying every 10 minutes (Flutterwave balance low); it completes on its own. failed means the money was returned to the user&apos;s wallet automatically. Retry re-attempts now; Force fail returns the funds and closes the request (needs access code). Use Mark Paid only if you paid the user outside Ona, it requires your access code and is logged.
          </p>
          <p className="mt-2 text-[11px] sm:text-xs text-red-800/80 dark:text-red-300/80 font-medium">
            Tips: limits, fees and auto-approve threshold live in the Settings tab, change them anytime, no developer needed.
          </p>
        </div>
      )}

      {/* Main Cashouts Card */}
      <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-120 flex flex-col">
        {/* Card Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
            Cashouts
          </h2>
          {!showBanner && (
            <button
              type="button"
              onClick={() => setShowBanner(true)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline cursor-pointer"
            >
              Read how cashouts work
            </button>
          )}
        </div>

        {/* Table / Empty State */}
        {cashoutList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
            <NoHistoryIllustration className="w-52 h-40 max-w-full" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
              No cashouts
            </h3>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-190 border-collapse">
              <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
                <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                  <th className="py-3 pl-6 pr-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Fee</th>
                  <th className="py-3 px-4 font-semibold">Net</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 pl-4 pr-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
                {cashoutList.map((c) => (
                  <tr
                    key={String(c.id)}
                    className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                  >
                    <td className="py-3.5 pl-6 pr-4 font-medium text-gray-900 dark:text-white">
                      {String(c.userId ?? "").slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                      ₦{Number(c.requestedAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">
                      ₦{c.feeAmount ?? 0}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                      ₦{Number(c.netAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize",
                          c.status === "paid"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : c.status === "pending"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                            : c.status === "rejected" || c.status === "failed"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                            : c.status === "processing"
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
                        )}
                      >
                        {String(c.status ?? "")}
                        {c.status === "processing" && c.retryCount
                          ? ` (try ${c.retryCount})`
                          : ""}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                onAction("approve-cashout", { id: c.id })
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onAction("reject-cashout", {
                                  id: c.id,
                                  reason: "Rejected",
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold cursor-pointer transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}

                        {c.status === "processing" ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                onAction("retry-cashout", { id: c.id })
                              }
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold cursor-pointer transition-colors"
                            >
                              Retry
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onAction("force-fail-cashout", {
                                  id: c.id,
                                  reason: "Admin forced failure",
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold cursor-pointer transition-colors"
                            >
                              Force fail
                            </button>
                          </>
                        ) : null}

                        {c.status === "failed" ? (
                          <button
                            type="button"
                            onClick={() =>
                              onAction("retry-cashout", { id: c.id })
                            }
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold cursor-pointer transition-colors"
                          >
                            Retry
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
