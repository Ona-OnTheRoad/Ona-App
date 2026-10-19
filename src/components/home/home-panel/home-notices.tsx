"use client";

import { X, Zap } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { PendingExpress } from "@/components/home/home-panel/use-pending-express";

export function LocationErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const t = useT();
  return (
    <div
      className="mx-4 mb-1 shrink-0 rounded-ona-ctl bg-ona-brand-soft px-3 py-2 text-[12px] text-ona-brand-ink"
      role="status"
    >
      {message}{" "}
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-[44px] items-center border-0 bg-transparent p-0 font-bold underline"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}

/** Empty state Repair Pro market only */
export function ProEmptyState({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const t = useT();
  const { query, filters } = useApp();
  const text = query.trim()
    ? t("search.noResultsFor", { q: query.trim() })
    : filters.availableNow
      ? t("home.noProsAvailable")
      : filters.rating45 || filters.verified || filters.fastResponse
        ? t("home.noProsMatch")
        : t("home.noRepairPros");
  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{ transform: "translateZ(0)" }}
    >
      <div className="p-4 text-center">
        <p className="text-sm font-semibold text-ona-ink">{text}</p>
        <button
          type="button"
          disabled={refreshing}
          onClick={onRefresh}
          className="mt-2 min-h-[44px] border-0 bg-transparent px-3 text-[13px] font-bold text-ona-brand-ink disabled:opacity-60"
        >
          {refreshing ? t("home.refreshing") : t("home.refresh")}
        </button>
      </div>
    </div>
  );
}

export function OpenRequestNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="shrink-0 pt-2.5">
      <div className="flex items-center justify-between gap-2 rounded-ona-card border-0 bg-ona-brand-soft px-3 py-2.5">
        <p className="text-[12px] font-semibold text-ona-ink">
          You have an open request. Complete or cancel it before starting
          another.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-11 w-11 shrink-0 items-center justify-center border-0 bg-transparent p-0 text-ona-brand-ink"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Unpaid Ona Express booking → "Finish payment" resume card. */
export function ExpressResumeCard({
  pending,
  onResume,
}: {
  pending: PendingExpress;
  onResume: () => void;
}) {
  return (
    <div className="shrink-0 pt-2.5">
      <button
        type="button"
        onClick={onResume}
        className="flex w-full items-center gap-3 rounded-ona-card border border-ona-border bg-ona-field px-3 py-2.5 text-left transition-transform active:scale-[0.985]"
      >
        <Zap className="h-5 w-5 shrink-0 text-ona-brand-ink" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-ona-ink">
            Finish payment
          </span>
          <span className="block text-[12px] text-ona-muted">
            {pending.trade.charAt(0).toUpperCase() + pending.trade.slice(1)} ·
            awaiting payment
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-bold text-ona-brand-ink">
          Resume
        </span>
      </button>
    </div>
  );
}
