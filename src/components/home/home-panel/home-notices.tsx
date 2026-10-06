"use client";

import { X, Zap } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
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
      className="mx-3 mb-1 shrink-0 rounded-md bg-[#FF6B35]/15 px-2.5 py-1.5 text-[11px] text-[#FF6B35]"
      role="status"
    >
      {message}{" "}
      <button type="button" onClick={onRetry} className="font-bold underline">
        {t("common.retry")}
      </button>
    </div>
  );
}

/** Empty state Repair Pro market only */
export function ProEmptyState({
  isLight,
  refreshing,
  onRefresh,
}: {
  isLight: boolean;
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
      className={cn(
        "shrink-0 overflow-hidden rounded-t-lg",
        isLight ? "bg-[#c8c9cd]" : "bg-black",
      )}
      style={{ transform: "translateZ(0)" }}
    >
      <div className="p-4 text-center">
        <p
          className={cn(
            "text-sm font-semibold",
            isLight ? "text-slate-800" : "text-white",
          )}
        >
          {text}
        </p>
        <button
          type="button"
          disabled={refreshing}
          onClick={onRefresh}
          className="mt-2 border-0 bg-transparent text-[12px] font-bold text-brand disabled:opacity-60"
        >
          {refreshing ? t("home.refreshing") : t("home.refresh")}
        </button>
      </div>
    </div>
  );
}

export function OpenRequestNotice({
  isLight,
  onDismiss,
}: {
  isLight: boolean;
  onDismiss: () => void;
}) {
  return (
    <div className="shrink-0 pt-2.5">
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-xl border-0 px-3 py-2.5",
          isLight ? "bg-[#FF6B35]/10" : "bg-[#FF6B35]/15",
        )}
      >
        <p
          className={cn(
            "text-[12px] font-semibold",
            isLight ? "text-slate-900" : "text-white",
          )}
        >
          You have an open request. Complete or cancel it before starting
          another.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 border-0 bg-transparent p-1 text-[#FF6B35]"
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
  isLight,
  pending,
  onResume,
}: {
  isLight: boolean;
  pending: PendingExpress;
  onResume: () => void;
}) {
  return (
    <div className="shrink-0 pt-2.5">
      <button
        type="button"
        onClick={onResume}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-left transition-transform active:scale-[0.985]",
          isLight
            ? "bg-[#d8dce4]/90"
            : "bg-gradient-to-b from-[#1a1a1a] to-[#141414]",
        )}
      >
        <Zap className="h-5 w-5 shrink-0 text-[#FF6B35]" />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-[14px] font-bold",
              isLight ? "text-slate-900" : "text-white",
            )}
          >
            Finish payment
          </span>
          <span
            className={cn(
              "block text-[12px]",
              isLight ? "text-slate-500" : "text-white/55",
            )}
          >
            {pending.trade.charAt(0).toUpperCase() + pending.trade.slice(1)} ·
            awaiting payment
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-bold text-[#FF6B35]">
          Resume
        </span>
      </button>
    </div>
  );
}
