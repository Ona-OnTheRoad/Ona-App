"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";

interface ProEmptyStateProps {
  title?: string;
  subtitle?: string;
  minHeight?: string;
}

export function ProEmptyState({
  title = "No problem solved",
  subtitle = "Solved problems will appear here.",
  minHeight = "min-h-[360px]",
}: ProEmptyStateProps) {
  return (
    <div
      className={`w-full rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 flex flex-col items-center justify-center text-center shadow-2xs ${minHeight}`}
    >
      <NoHistoryIllustration className="h-44 w-52 max-w-full" aria-hidden />
      <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}
