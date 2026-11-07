"use client";

import { cn } from "@/lib/utils";

interface JobsStatusBadgeProps {
  status: string;
  className?: string;
}

export function JobsStatusBadge({ status, className }: JobsStatusBadgeProps) {
  const norm = status.toLowerCase().trim();

  let styles =
    "bg-gray-50 dark:bg-[#1a1920] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/80";

  if (norm === "draft" || norm === "requested") {
    styles =
      "bg-gray-50 dark:bg-[#1a1920] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/80";
  } else if (norm === "expired") {
    styles =
      "bg-amber-50 dark:bg-[#2a1d15] text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80";
  } else if (norm === "cancelled") {
    styles =
      "bg-pink-50 dark:bg-[#2b1820] text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800/80";
  } else if (norm === "completed") {
    styles =
      "bg-emerald-50 dark:bg-[#14261d] text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80";
  } else if (norm === "failed") {
    styles =
      "bg-red-50 dark:bg-[#2a181c] text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/80";
  } else if (norm === "in_progress" || norm === "en_route") {
    styles =
      "bg-blue-50 dark:bg-[#152132] text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80";
  } else if (norm === "matched" || norm === "accepted") {
    styles =
      "bg-purple-50 dark:bg-[#20182b] text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/80";
  }

  // Capitalize nicely
  const displayLabel = norm.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full min-w-[72px] capitalize transition-colors",
        styles,
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}

