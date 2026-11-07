"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { JobsStatusBadge } from "@/components/admin/jobs/jobs-status-badge";
import type { JobRecord } from "@/lib/jobs/types";

interface DisputesTableProps {
  jobs: JobRecord[];
  busyId: string | null;
  splitPct: Record<string, number>;
  onSplitChange: (jobId: string, pct: number) => void;
  onResolve: (
    jobId: string,
    kind: "dispute" | "appeal",
    outcome: "full_release_pro" | "full_refund_motorist" | "partial_split",
  ) => Promise<void>;
}

export function DisputesTable({
  jobs,
  busyId,
  splitPct,
  onSplitChange,
  onResolve,
}: DisputesTableProps) {
  return (
    <div className="bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl mt-6 min-h-[460px] flex flex-col shadow-xs overflow-hidden">
      {/* Card Header Title */}
      <div className="px-6 pt-5 pb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          Active cases
        </h2>
      </div>

      {jobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No open disputes.
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-relaxed">
            Cases appear when motorist or pro opens a dispute after payment.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px] border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold">Job</th>
                <th className="py-3 px-4 font-semibold">Parties</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Reason</th>
                <th className="py-3 px-4 font-semibold">Evidence</th>
                <th className="py-3 pl-4 pr-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {jobs.map((j) => (
                <tr
                  key={j.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-4">
                    <div className="font-mono font-semibold text-gray-900 dark:text-white text-xs">
                      {j.id.slice(0, 12)}…
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
                      {j.agreedMajor != null ? `${j.currency} ${j.agreedMajor}` : ""}{" "}
                      · {j.serviceType}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900 dark:text-gray-200">
                      {j.motoristName}
                    </div>
                    <div className="text-gray-400 dark:text-gray-500 text-[11px]">
                      {j.repairProName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <JobsStatusBadge status={j.status} />
                    {j.evidence?.priority === "auto_priority" ? (
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
                        AI priority
                      </div>
                    ) : null}
                    {j.evidence?.priority === "request_more" ? (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                        Need more evidence
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-medium text-gray-900 dark:text-gray-200 truncate">
                      {j.dispute?.reason || "Dispute raised"}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-[11px] truncate mt-0.5">
                      {j.dispute?.description || "—"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {j.evidence ? (
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {j.evidence.composite}
                        </span>
                        <span className="text-gray-400 text-[10px]">/100</span>
                        <div className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5 font-mono">
                          P{j.evidence.photoScore} V{j.evidence.voiceScore} L
                          {j.evidence.locationScore} T{j.evidence.timestampScore}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3.5 pl-4 pr-6 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <label className="text-[10px] text-gray-400 flex items-center gap-1">
                        Split % pro:
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={splitPct[j.id] ?? 70}
                          onChange={(e) =>
                            onSplitChange(j.id, Number(e.target.value))
                          }
                          className="w-12 px-1 py-0.5 text-center text-xs bg-gray-50 dark:bg-[#121116] border border-gray-200 dark:border-[#27272a] rounded"
                        />
                      </label>
                      <div className="flex items-center gap-1">
                        {j.status === "disputed" ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === j.id}
                              onClick={() =>
                                void onResolve(j.id, "dispute", "full_release_pro")
                              }
                              className="px-2 py-1 rounded bg-ona-brand-btn text-white text-[11px] font-semibold hover:bg-[#e0482b] disabled:opacity-50"
                            >
                              Full → Pro
                            </button>
                            <button
                              type="button"
                              disabled={busyId === j.id}
                              onClick={() =>
                                void onResolve(j.id, "dispute", "full_refund_motorist")
                              }
                              className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] font-semibold hover:bg-gray-200 disabled:opacity-50"
                            >
                              Refund
                            </button>
                            <button
                              type="button"
                              disabled={busyId === j.id}
                              onClick={() =>
                                void onResolve(j.id, "dispute", "partial_split")
                              }
                              className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] font-semibold hover:bg-gray-200 disabled:opacity-50"
                            >
                              Split
                            </button>
                          </>
                        ) : null}

                        {j.status === "under_appeal" ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === j.id}
                              onClick={() =>
                                void onResolve(j.id, "appeal", "full_release_pro")
                              }
                              className="px-2 py-1 rounded bg-ona-brand-btn text-white text-[11px] font-semibold hover:bg-[#e0482b] disabled:opacity-50"
                            >
                              Uphold
                            </button>
                            <button
                              type="button"
                              disabled={busyId === j.id}
                              onClick={() =>
                                void onResolve(j.id, "appeal", "full_refund_motorist")
                              }
                              className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] font-semibold hover:bg-gray-200 disabled:opacity-50"
                            >
                              Reverse
                            </button>
                            <button
                              type="button"
                              disabled={busyId === j.id}
                              onClick={() =>
                                void onResolve(j.id, "appeal", "partial_split")
                              }
                              className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[11px] font-semibold hover:bg-gray-200 disabled:opacity-50"
                            >
                              New split
                            </button>
                          </>
                        ) : null}
                      </div>
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
