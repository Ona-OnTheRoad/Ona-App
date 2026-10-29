"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { cn } from "@/lib/utils";

interface ProEmptyStateProps {
  title?: string;
  subtitle?: string;
  minHeight?: string;
  className?: string;
}

export function ProEmptyState({
  title = "No problem solved",
  subtitle = "Solved problems will appear here.",
  minHeight = "min-h-[360px]",
  className,
}: ProEmptyStateProps) {
  return (
    <div
      className={cn(
        "w-full flex-1 flex flex-col rounded-ona-card border border-ona-border bg-ona-surface p-8 items-center justify-center text-center shadow-xs dark:rounded-ona-sheet dark:border-[#333E4F] dark:bg-ona-bg dark:p-2.5 dark:shadow-none transition-colors",
        minHeight,
        className,
      )}
    >
      <div className="w-full flex-1 flex flex-col items-center justify-center text-center dark:rounded-[14px] dark:border dark:border-[#18181B] dark:bg-ona-field dark:p-6">
        <div className="flex items-center justify-center mb-1">
          <NoHistoryIllustration className="h-48 w-56 dark:h-44 dark:w-52 max-w-full" aria-hidden />
        </div>
        <h3 className="mt-4 dark:mt-3 text-[16px] font-bold text-ona-ink">
          {title}
        </h3>
        <p className="mt-1 dark:mt-1.5 text-[13px] text-ona-muted max-w-xs">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
