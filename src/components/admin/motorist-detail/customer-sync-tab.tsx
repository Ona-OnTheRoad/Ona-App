"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Detail } from "./types";

interface CustomerSyncTabProps {
  data: Detail;
  busy: boolean;
  onReSync: () => void;
}

export function CustomerSyncTab({ data, busy, onReSync }: CustomerSyncTabProps) {
  const roles = data.identity?.roles || [];
  const rolesText =
    roles.length > 0
      ? [
          roles.includes("motorist") ? "Customer" : null,
          roles.includes("repair_pro") ? "Repair Pro" : null,
        ]
          .filter(Boolean)
          .join(" + ")
      : "—";

  const payoutText = data.identity?.payoutMethod
    ? `${data.identity.payoutMethod.bank_name || "Bank"} · …${data.identity.payoutMethod.account_number_last4 || "????"}`
    : "—";

  const completedFields =
    data.identity?.completedFields && data.identity.completedFields.length > 0
      ? data.identity.completedFields.join(", ")
      : "—";

  const missingFields =
    data.identity?.missingFields && data.identity.missingFields.length > 0
      ? data.identity.missingFields.join(", ")
      : "—";

  const syncStatus = data.identity?.syncStatus || "unknown";

  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
      {/* Card Header Toolbar */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100 dark:border-[#27272a]">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          Accounts & identity sync
        </h2>
        <button
          type="button"
          disabled={busy}
          onClick={onReSync}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", busy && "animate-spin")} />
          <span>Re-run sync</span>
        </button>
      </div>

      {/* Grid of sync properties */}
      <div className="divide-y divide-gray-100 dark:divide-[#27272a] text-xs">
        {/* Row 1: Attached Roles & Sync Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-[#27272a]">
          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              ATTACHED ROLES
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
              {rolesText}
            </span>
          </div>

          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              SYNC STATUS
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-mono">
                {syncStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Payout Method & Completed Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-[#27272a]">
          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              PAYOUT METHOD
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
              {payoutText}
            </span>
          </div>

          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              COMPLETED FIELDS
            </span>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-mono mt-1 block">
              {completedFields}
            </span>
          </div>
        </div>

        {/* Row 3: Missing Fields & Recent Sync Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-[#27272a]">
          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              MISSING FIELDS
            </span>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-mono mt-1 block">
              {missingFields}
            </span>
          </div>

          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              RECENT SYNC EVENTS
            </span>
            {data.identity?.syncLog && data.identity.syncLog.length > 0 ? (
              <div className="space-y-1.5 mt-1">
                {data.identity.syncLog.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="text-xs font-mono text-gray-600 dark:text-gray-400 flex items-center justify-between"
                  >
                    <span>
                      {log.action} · {log.result}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                No recent sync events.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
