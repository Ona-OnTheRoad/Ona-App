"use client";

import { Search, Loader2 } from "lucide-react";

interface DashboardBackupProps {
  backupBusy: boolean;
  busy: boolean;
  latestBackup: string | null;
  backupSearch: string;
  setBackupSearch: (v: string) => void;
  runBackupNow: () => Promise<void>;
}

export function DashboardBackup({
  backupBusy,
  busy,
  latestBackup,
  backupSearch,
  setBackupSearch,
  runBackupNow,
}: DashboardBackupProps) {
  return (
    <div className="bg-white dark:bg-[#18171c] border border-[#eaecf0] dark:border-[#27272a] rounded-2xl p-5 sm:p-6">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Local BackUp
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed max-w-md">
            Automatically saves payment, job, and banking data snapshots locally
            whenever payment statuses update.
          </p>
        </div>
        <button
          type="button"
          disabled={backupBusy || busy}
          onClick={() => void runBackupNow()}
          className="bg-ona-brand-btn hover:bg-ona-brand-press active:bg-[#c93b20] text-white rounded-xl px-4 py-2 text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          {backupBusy ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Backing up…
            </>
          ) : (
            "Backup now"
          )}
        </button>
      </div>

      {/* Status */}
      <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mt-3.5 uppercase tracking-wide">
        STATUS:{" "}
        <span className="font-normal lowercase">
          {latestBackup ? `latest: ${latestBackup}` : "No snapshots created yet."}
        </span>
      </div>

      {/* Search Input Well */}
      <div className="relative flex items-center w-full px-3 py-2 rounded-xl bg-[#f9fafb] dark:bg-[#121116] border border-[#e5e7eb] dark:border-[#27272a] focus-within:border-ona-brand dark:focus-within:border-ona-brand mt-3 transition-colors">
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-2.5" />
        <input
          type="search"
          value={backupSearch}
          onChange={(e) => setBackupSearch(e.target.value)}
          placeholder="Search backup directories & files..."
          className="w-full bg-transparent border-0 p-0 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}

