"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface JobsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function JobsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: JobsPaginationProps) {
  const [jumpInput, setJumpInput] = useState("");

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
      setJumpInput("");
    }
  };

  // Build page numbers window
  const pages: (number | "ellipsis")[] = [];
  const maxButtons = 8;
  const start = 1;
  const end = Math.min(totalPages, maxButtons);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (totalPages > maxButtons) {
    if (!pages.includes(totalPages)) {
      pages.push("ellipsis");
      pages.push(totalPages);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs select-none">
      {/* Left + Numbers + Next */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap text-gray-500 dark:text-gray-400">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer px-1 py-0.5"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-gray-400">
                  …
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  "min-w-[24px] h-6 flex items-center justify-center rounded px-1 font-medium transition-colors cursor-pointer",
                  isActive
                    ? "text-ona-brand font-bold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer px-1 py-0.5"
        >
          Next →
        </button>
      </div>

      {/* Right Jump To Page Form */}
      <form onSubmit={handleJumpSubmit} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
        <span>Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jumpInput}
          onChange={(e) => setJumpInput(e.target.value)}
          placeholder={currentPage.toString()}
          className="w-12 px-2 py-1 text-center rounded-lg bg-gray-50 dark:bg-[#121116] border border-gray-200 dark:border-[#27272a] text-gray-900 dark:text-white focus:outline-none focus:border-ona-brand text-xs"
        />
        <span>Page</span>
      </form>
    </div>
  );
}
