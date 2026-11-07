"use client";

import { Search } from "lucide-react";
import type { SearchHit } from "./types";

interface DashboardSearchProps {
  query: string;
  setQuery: (v: string) => void;
  hits: SearchHit[];
  openJob: (id: string) => Promise<void>;
}

export function DashboardSearch({
  query,
  setQuery,
  hits,
  openJob,
}: DashboardSearchProps) {
  return (
    <div className="bg-white dark:bg-[#18171c] border border-[#eaecf0] dark:border-[#27272a] rounded-2xl p-5 sm:p-6 mt-5">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">
        Search users
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Search phone · name · job ID · plate
      </p>

      {/* Input Well */}
      <div className="relative flex items-center w-full px-3 py-2 rounded-xl bg-[#f9fafb] dark:bg-[#121116] border border-[#e5e7eb] dark:border-[#27272a] focus-within:border-ona-brand dark:focus-within:border-ona-brand mt-3 transition-colors">
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-2.5" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search phone · name · job ID · plate"
          className="w-full bg-transparent border-0 p-0 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0"
        />
      </div>

      {/* Results Dropdown */}
      {hits.length > 0 ? (
        <ul className="mt-3 space-y-1.5 max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-[#27272a]">
          {hits.map((h) => (
            <li key={`${h.kind}-${h.id}`} className="pt-1.5">
              <button
                type="button"
                className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1f1e24] transition-colors cursor-pointer"
                onClick={() => {
                  if (h.kind === "job") void openJob(h.id);
                  else window.location.href = `/admin/users`;
                }}
              >
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  <span className="text-ona-brand mr-1">[{h.kind}]</span>
                  {h.title}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {h.subtitle}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

