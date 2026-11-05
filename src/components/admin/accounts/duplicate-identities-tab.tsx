"use client";

import type { Dispatch, SetStateAction } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import {
  SIGNAL_LABELS,
  fmt,
  matchReasonLabel,
  type Board,
  type MergeCandidate,
} from "./types";

interface DuplicateIdentitiesTabProps {
  data: Board | null;
  primaryOverride: Record<string, "primary" | "duplicate">;
  setPrimaryOverride: Dispatch<
    SetStateAction<Record<string, "primary" | "duplicate">>
  >;
  busyMerge: string | null;
  scanning: boolean;
  onScan: () => void;
  onDecide: (candidate: MergeCandidate, action: "merge" | "reject") => void;
}

export function DuplicateIdentitiesTab({
  data,
  primaryOverride,
  setPrimaryOverride,
  busyMerge,
  scanning,
  onScan,
  onDecide,
}: DuplicateIdentitiesTabProps) {
  const merges = data?.merges ?? [];

  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[480px] flex flex-col">
      {/* Header Toolbar */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          Duplicate identities <span className="text-xs sm:text-sm font-normal text-gray-400 dark:text-gray-500">· review before merge</span>
        </h2>
        <button
          type="button"
          disabled={scanning}
          onClick={onScan}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", scanning && "animate-spin")} />
          <span>Scan for duplicates</span>
        </button>
      </div>

      {/* Table / Empty State */}
      {merges.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No duplicate identities found.
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm leading-relaxed">
            Run a scan to check for duplicate accounts matched by NIN or BVN across Customer and Repair Pro records.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[800px] border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold w-[25%]">
                  Primary Identity (Keeps)
                </th>
                <th className="py-3 px-4 font-semibold w-[25%]">
                  Duplicate (Merged In)
                </th>
                <th className="py-3 px-4 font-semibold w-[22%]">
                  Why Matched / Date
                </th>
                <th className="py-3 px-4 font-semibold w-[14%]">
                  Which To Keep
                </th>
                <th className="py-3 pl-4 pr-6 font-semibold w-[14%] text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {merges.map((m) => {
                const whySignal = m.match_detail?.matched_signal
                  ? `${SIGNAL_LABELS[String(m.match_detail.matched_signal)] || m.match_detail.matched_signal} · ${String(m.match_detail.matched_value || "")}`
                  : matchReasonLabel(m.match_reason);

                return (
                  <tr
                    key={m.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                  >
                    <td className="py-3.5 pl-6 pr-4">
                      <div className="font-semibold text-gray-900 dark:text-white text-xs">
                        {m.primary_name || "Unnamed"}
                      </div>
                      <div className="font-mono text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {m.primary_email || "—"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white text-xs">
                        {m.duplicate_name || "Unnamed"}
                      </div>
                      <div className="font-mono text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {m.duplicate_email || "—"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {whySignal}
                      </div>
                      <div className="font-mono text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {fmt(m.created_at)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={primaryOverride[m.id] || "primary"}
                        onChange={(e) =>
                          setPrimaryOverride((s) => ({
                            ...s,
                            [m.id]: e.target.value as "primary" | "duplicate",
                          }))
                        }
                        className="bg-transparent border border-gray-200 dark:border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-ona-brand dark:focus:border-ona-brand cursor-pointer"
                      >
                        <option value="primary" className="dark:bg-[#18171c]">
                          Primary identity
                        </option>
                        <option value="duplicate" className="dark:bg-[#18171c]">
                          Duplicate identity
                        </option>
                      </select>
                    </td>

                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={busyMerge === m.id}
                        onClick={() => onDecide(m, "merge")}
                        className="px-2.5 py-1 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                      >
                        {busyMerge === m.id ? "…" : "Approve merge"}
                      </button>
                      <button
                        type="button"
                        disabled={busyMerge === m.id}
                        onClick={() => onDecide(m, "reject")}
                        className="px-2.5 py-1 rounded-lg border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444]/10 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors ml-1.5"
                      >
                        Reject
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

