"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import type { Board } from "./types";

interface DashboardJobBoardProps {
  board: Board | null;
  selectedJobId: string | null;
  refreshBoard: () => Promise<void>;
  openJob: (id: string) => Promise<void>;
}

export function DashboardJobBoard({
  board,
  selectedJobId,
  refreshBoard,
  openJob,
}: DashboardJobBoardProps) {
  const jobs = board?.jobs ?? [];

  return (
    <div className="bg-white dark:bg-[#18171c] border border-[#eaecf0] dark:border-[#27272a] rounded-2xl p-5 sm:p-6 mt-5 min-h-[460px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#27272a]/60">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">
          Live job board
        </h2>
        <button
          type="button"
          onClick={() => void refreshBoard()}
          className="bg-ona-brand-btn hover:bg-ona-brand-press active:bg-[#c93b20] text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Body: Empty State or Table */}
      {jobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4">
          <NoHistoryIllustration className="w-48 h-36 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No active jobs yet
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
            active jobs appear when motorist
          </p>
          <Link
            href="/admin/jobs"
            className="text-xs font-semibold text-ona-brand hover:underline mt-4 inline-block transition-colors"
          >
            View jobs list
          </Link>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#27272a] text-gray-400 dark:text-gray-500 font-semibold">
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Parties</th>
                <th className="pb-2 font-medium">₦ Amount</th>
                <th className="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#27272a]/60">
              {jobs.map((j) => {
                const isSelected = selectedJobId === j.id;
                return (
                  <tr
                    key={j.id}
                    className={`hover:bg-gray-50 dark:hover:bg-[#1f1e24] transition-colors cursor-pointer ${
                      isSelected ? "bg-orange-50/50 dark:bg-[#261f22]" : ""
                    }`}
                    onClick={() => void openJob(j.id)}
                  >
                    <td className="py-2.5">
                      <span className="font-mono text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                        {j.flow_status || j.status}
                      </span>
                      {j.escrow_status ? (
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          escrow: {j.escrow_status}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-2.5">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {j.motorist_name || "Motorist"}
                      </div>
                      <div className="text-gray-400 dark:text-gray-500 text-[11px]">
                        {j.repair_pro_name || "Repair Pro"}
                      </div>
                    </td>
                    <td className="py-2.5 font-semibold text-gray-900 dark:text-gray-100">
                      ₦{Number(j.agreed_major || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void openJob(j.id);
                        }}
                        className="text-xs text-ona-brand hover:underline font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
