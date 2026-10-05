"use client";

import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export function ChatThreadMissing({
  isLight,
  isPro,
  onBack,
}: {
  isLight: boolean;
  isPro: boolean;
  onBack: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col",
        isLight ? "bg-[#c8c9cd]" : "bg-black",
      )}
    >
      <PageHeader title="Chat" backHref={isPro ? "/jobs" : "/requests"} />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6">
        <p
          className={cn(
            "font-semibold",
            isLight ? "text-slate-900" : "text-white",
          )}
        >
          Loading chat…
        </p>
        <p className="text-center text-xs text-muted">
          Chat is tied to a request. Open Message from your job if it does not
          appear.
        </p>
        <button
          type="button"
          className="mt-2 border-0 bg-transparent text-sm font-bold text-brand"
          onClick={onBack}
        >
          Back to {isPro ? "jobs" : "requests"}
        </button>
      </div>
    </div>
  );
}
