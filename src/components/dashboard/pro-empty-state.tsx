"use client";

import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";

interface ProEmptyStateProps {
  title?: string;
  subtitle?: string;
}

export function ProEmptyState({
  title = "No problem solved",
  subtitle = "Solved problems will appear here.",
}: ProEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <NoHistoryIllustration className="h-44 w-52 max-w-full" aria-hidden />
      <h3 className="mt-4 text-[16px] font-bold text-ona-ink">
        {title}
      </h3>
      <p className="mt-1 text-[13px] font-medium text-ona-muted">
        {subtitle}
      </p>
    </div>
  );
}
