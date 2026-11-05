"use client";

import Image from "next/image";

export type MessageReportRow = {
  id: string;
  message_id: string;
  reporter_id: string;
  reason: string;
  details?: string;
  status: string;
  created_at: string;
};

interface ReportsTabProps {
  reports: MessageReportRow[];
  onModerate: (action: string, id: string) => Promise<void>;
  moderatingId: string | null;
}

export function ReportsTab({
  reports,
  onModerate,
  moderatingId,
}: ReportsTabProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#141318] shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Reports & moderation
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] dark:bg-[#18171c] border-y border-gray-200 dark:border-white/5 text-xs font-semibold text-gray-600 dark:text-gray-400">
              <th className="px-6 py-3.5">When</th>
              <th className="px-6 py-3.5">Reason</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <Image
                        src="/images/reports-moderation.png"
                        alt="No reports, all clear"
                        width={280}
                        height={200}
                        className="w-60 sm:w-72 h-auto object-contain dark:grayscale dark:contrast-125 dark:brightness-95"
                      />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                      No reports, all clear.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const isWorking = moderatingId === r.id || moderatingId === r.message_id;
                return (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-800 dark:text-gray-200">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {r.reason}
                      </div>
                      {r.details ? (
                        <div className="text-gray-500 text-[11px] mt-0.5">
                          {r.details}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                          r.status === "open"
                            ? "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20"
                            : r.status === "reviewed"
                            ? "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs whitespace-nowrap">
                      {r.status === "open" || r.status === "reviewed" ? (
                        <div className="flex items-center gap-2">
                          {r.status === "open" && (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => void onModerate("review-report", r.id)}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-ona-brand-btn text-white hover:bg-[#d9482b] disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              Review
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => void onModerate("delete-message", r.message_id)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            Delete message
                          </button>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => void onModerate("dismiss-report", r.id)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Closed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

