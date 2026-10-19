"use client";

import { PageHeader } from "@/components/layout/page-header";

export function ChatThreadMissing({
  isPro,
  onBack,
}: {
  isLight?: boolean;
  isPro: boolean;
  onBack: () => void;
}) {
  return (
    <div className="ona2 flex h-full min-h-0 flex-col">
      <PageHeader title="Chat" backHref={isPro ? "/jobs" : "/requests"} />
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-6">
        <p className="font-semibold text-ona-ink">Loading chat…</p>
        <p className="text-center text-xs text-ona-muted">
          Chat is tied to a request. Open Message from your job if it does not
          appear.
        </p>
        <button
          type="button"
          className="mt-2 border-0 bg-transparent h-11 text-sm font-semibold text-ona-brand-ink"
          onClick={onBack}
        >
          Back to {isPro ? "jobs" : "requests"}
        </button>
      </div>
    </div>
  );
}
