"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { JobsStatusBadge } from "./jobs-status-badge";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";

export type AdminJobItem = {
  id: string;
  status: string;
  service_type: string;
  description: string;
  created_at: string;
  motorist?: { full_name: string; email?: string } | null;
  pro?: { full_name: string; email?: string } | null;
};

const AVAILABLE_STATUSES = [
  "draft",
  "requested",
  "matched",
  "accepted",
  "en_route",
  "in_progress",
  "completed",
  "cancelled",
  "failed",
  "expired",
] as const;

interface JobsTableProps {
  jobs: AdminJobItem[];
  updatingId: string | null;
  onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
}

export function JobsTable({
  jobs,
  updatingId,
  onUpdateStatus,
}: JobsTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs min-w-[760px] border-collapse">
        {/* Table Header: distinct background color and visible border extending to both sides */}
        <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
          <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
            <th className="py-3 pl-6 pr-4 font-semibold w-[32%]">Job</th>
            <th className="py-3 px-4 font-semibold w-[22%]">Customer</th>
            <th className="py-3 px-4 font-semibold w-[18%]">Pro</th>
            <th className="py-3 px-4 font-semibold w-[14%]">Status</th>
            <th className="py-3 pl-4 pr-6 font-semibold w-[14%] text-right">Update (Save)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-16 text-center">
                <div className="flex flex-col items-center justify-center">
                  <NoHistoryIllustration className="w-48 h-36 max-w-full" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
                    No active jobs yet
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
                    New motorist requests and ongoing jobs will appear here.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            jobs.map((j) => {
              const isUpdating = updatingId === j.id;
              const customerName = j.motorist?.full_name || "Guest Motorist";
              const proName = j.pro?.full_name || "Unassigned";

              return (
                <tr
                  key={j.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                >
                  {/* Job Column */}
                  <td className="py-3.5 pl-6 pr-4">
                    <div className="font-semibold text-gray-900 dark:text-white capitalize text-sm">
                      {j.service_type || "Service Request"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 max-w-md">
                      {j.description || `Job ID: ${j.id.slice(0, 8)}`}
                    </div>
                  </td>

                  {/* Customer Column */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900 dark:text-gray-200">
                      {customerName}
                    </div>
                  </td>

                  {/* Pro Column */}
                  <td className="py-3.5 px-4">
                    <div
                      className={
                        proName === "Unassigned"
                          ? "text-gray-400 dark:text-gray-500"
                          : "font-medium text-gray-900 dark:text-gray-200"
                      }
                    >
                      {proName}
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="py-3.5 px-4">
                    <JobsStatusBadge status={j.status} />
                  </td>

                  {/* Update (Save) Column with Actions Dropdown */}
                  <td className="py-3.5 pl-4 pr-6 text-right">
                    <div className="relative inline-block text-left">
                      <div className="flex items-center justify-end gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2e2d36] text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1a1920] hover:bg-gray-100 dark:hover:bg-[#23222a] transition-colors cursor-pointer select-none">
                        {isUpdating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-ona-brand" />
                        ) : null}
                        <span>Actions</span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        <select
                          value={j.status}
                          disabled={isUpdating}
                          onChange={(e) => void onUpdateStatus(j.id, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                          title="Change status"
                        >
                          {AVAILABLE_STATUSES.map((s) => (
                            <option
                              key={s}
                              value={s}
                              className="bg-white dark:bg-[#18171c] text-gray-900 dark:text-white"
                            >
                              {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
