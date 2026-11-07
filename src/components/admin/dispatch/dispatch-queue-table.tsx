"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { fmtClock } from "./format";
import { JobCooldownCell, JobStatusCell } from "./job-cells";
import { JobControlsCell } from "./job-controls-cell";
import type { DispatchJob } from "./types";

interface DispatchQueueTableProps {
  queue: DispatchJob[];
  lastRefresh: string | null;
  busyId: string | null;
  setProOptions: Map<string, string>;
  availablePros: { id: string; name: string }[];
  onAction: (action: string, job: DispatchJob) => void;
  onProChange: (jobId: string, proId: string) => void;
}

export function DispatchQueueTable({
  queue,
  lastRefresh,
  busyId,
  setProOptions,
  availablePros,
  onAction,
  onProChange,
}: DispatchQueueTableProps) {
  return (
    <div className="bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl mt-6 min-h-120 flex flex-col shadow-xs overflow-hidden">
      {/* Header Title with padding */}
      <div className="px-6 pt-5 pb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          Active requests{" "}
          <span className="font-normal text-xs text-gray-500 dark:text-gray-400 ml-1">
            · refresh {lastRefresh || "…"} (auto 5s)
          </span>
        </h2>
      </div>

      {/* Body: Empty State or Active Table */}
      {queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No history yet
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-relaxed">
            No active requests right now.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-190 border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold">Request</th>
                <th className="py-3 px-4 font-semibold">Customer → Pro</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Cooldowns / Timers</th>
                <th className="py-3 pl-4 pr-6 font-semibold text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {queue.map((j) => (
                <tr
                  key={j.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                >
                  <td className="py-3.5 pl-6 pr-4">
                    <div className="font-mono font-semibold text-gray-900 dark:text-white text-xs">
                      {j.id.slice(0, 8)}…
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
                      {j.serviceType}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      Created {fmtClock(j.createdAt)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900 dark:text-gray-200">
                      {j.motoristName || j.motoristId.slice(0, 8)}
                    </div>
                    <div className="text-gray-400 dark:text-gray-500 text-[11px]">
                      → {j.chosenProName || (j.chosenProId ? j.chosenProId.slice(0, 8) : j.proName || "None")}
                    </div>
                  </td>
                  <JobStatusCell j={j} />
                  <JobCooldownCell j={j} />
                  <JobControlsCell
                    j={j}
                    busyId={busyId}
                    proValue={setProOptions.get(j.id) || ""}
                    availablePros={availablePros}
                    onAction={onAction}
                    onProChange={onProChange}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
