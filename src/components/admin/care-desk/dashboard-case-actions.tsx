"use client";

import Link from "next/link";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";

interface DashboardCaseActionsProps {
  jobDetail: {
    job: Record<string, unknown>;
    escrow: Record<string, unknown> | null;
  } | null;
  job: Record<string, unknown> | undefined;
  flow: string;
  selectedJobId: string | null;
  busy: boolean;
  runAction: (body: Record<string, unknown>, reason: string) => Promise<void>;
}

export function DashboardCaseActions({
  jobDetail,
  job,
  flow,
  selectedJobId,
  busy,
  runAction,
}: DashboardCaseActionsProps) {
  return (
    <div className="bg-white dark:bg-[#18171c] border border-[#eaecf0] dark:border-[#27272a] rounded-2xl p-5 sm:p-6 mt-5 min-h-[380px] flex flex-col">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
        Case actions
      </h2>

      {!jobDetail ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <NoHistoryIllustration className="w-48 h-36 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No open disputes.
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-relaxed">
            Cases appear when motorist or pro opens a dispute after payment.
          </p>
          <Link
            href="/admin/disputes"
            className="text-xs font-semibold text-ona-brand hover:underline mt-4 inline-block transition-colors"
          >
            View disputes
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between mt-2">
          <div className="space-y-2 text-xs bg-gray-50 dark:bg-[#121116] p-3.5 rounded-xl border border-gray-100 dark:border-[#27272a]">
            <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
              ID: {String(job?.id || selectedJobId)}
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {String(job?.status || flow)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Customer: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {String(job?.motoristName || job?.motorist_name || "—")}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Repair Pro: </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {String(job?.repairProName || job?.repair_pro_name || "—")}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-[#27272a]">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(
                  { type: "release_escrow", jobId: selectedJobId },
                  "Enter password to release escrow to the Repair Pro.",
                )
              }
              className="bg-ona-brand-btn hover:bg-ona-brand-press text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
            >
              Release escrow
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(
                  { type: "refund_escrow", jobId: selectedJobId },
                  "Enter password to refund escrow to the motorist.",
                )
              }
              className="bg-gray-100 dark:bg-[#25242b] hover:bg-gray-200 dark:hover:bg-[#2e2d36] text-gray-800 dark:text-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors"
            >
              Refund escrow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

