"use client";

/**
 * Payment / payout activity.
 * Status tabs + period strip (1D…YTD). Flat money list. No cards, glow, gradient.
 */

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ActivityLedger } from "@/components/settings-pages/payments-activity/activity-ledger";
import {
  PeriodStrip,
  StatusTabs,
} from "@/components/settings-pages/payments-activity/activity-controls";
import {
  periodLabel,
  periodStartMs,
  type DateFilter,
  type StatusFilter,
} from "@/components/settings-pages/payments-activity/activity-filters";
import { formatMoneyMinor } from "@/lib/pricing";
import {
  isOpenStatus,
  isReleasedStatus,
  usePaymentHistory,
} from "@/lib/payments/use-payment-history";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function PaymentsActivityPage() {
  const { theme } = useApp();
  const isLight = theme === "light";
  const { isPro, rows, loading, error, reload } = usePaymentHistory();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("1m");

  const ink = isLight ? "text-slate-900" : "text-white";
  const muted = isLight ? "text-slate-600" : "text-white/60";
  const line = isLight ? "border-black/12" : "border-white/12";
  const segLine = isLight ? "border-black/15" : "border-white/15";

  const filtered = useMemo(() => {
    const dateMin = periodStartMs(dateFilter);

    return rows.filter((p) => {
      if (statusFilter === "active" && !isOpenStatus(p.escrowStatus)) {
        return false;
      }
      if (
        statusFilter === "released" &&
        !isReleasedStatus(p.escrowStatus, p.statusLabel)
      ) {
        return false;
      }
      if (statusFilter === "refunded" && p.escrowStatus !== "refunded") {
        return false;
      }
      const t = new Date(p.createdAt).getTime();
      if (Number.isNaN(t) || t < dateMin) return false;
      return true;
    });
  }, [rows, statusFilter, dateFilter]);

  const periodTotalMinor = useMemo(() => {
    return filtered.reduce((sum, p) => {
      const amt =
        isPro && p.proPayoutMinor != null ? p.proPayoutMinor : p.amountMinor;
      return sum + (Number(amt) || 0);
    }, 0);
  }, [filtered, isPro]);

  const periodCurrency = filtered[0]?.currency || rows[0]?.currency || "NGN";

  const statusChips: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Open" },
    { key: "released", label: isPro ? "Paid out" : "Released" },
    { key: "refunded", label: "Refunded" },
  ];

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        isLight ? "bg-[#c8c9cd]" : "bg-black",
      )}
    >
      <PageHeader title="Activity" backHref="/settings/payments" />

      <div className="flex-1 overflow-y-auto px-4 pb-10 scrollbar-hide">
        {/* Status: full-width segmented tabs */}
        <StatusTabs
          chips={statusChips}
          value={statusFilter}
          onChange={setStatusFilter}
          segLine={segLine}
          muted={muted}
        />

        {/* Period strip: 1D 3D 7D 1M 3M 6M 1Y YTD */}
        <PeriodStrip
          value={dateFilter}
          onChange={setDateFilter}
          onReload={() => void reload()}
          muted={muted}
        />

        {/* Period summary money showcase line */}
        <div className={cn("mt-5 border-b pb-4", line)}>
          <p
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.14em]",
              muted,
            )}
          >
            {periodLabel(dateFilter)}
          </p>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <p
              className="text-[28px] font-black leading-none tracking-tight tabular-nums text-[#FF6B35]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatMoneyMinor(periodTotalMinor, periodCurrency)}
            </p>
            <p className={cn("pb-0.5 text-[12px] font-semibold", muted)}>
              {filtered.length} move{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {error ? (
          <p className="py-4 text-center text-[13px] font-semibold text-red-500">
            {error}
          </p>
        ) : null}

        {loading && rows.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-[#FF6B35]" />
          </div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className={cn("text-[15px] font-bold", ink)}>
              No moves in this period
            </p>
            <p className={cn("mt-1 text-[12px] font-medium", muted)}>
              Try another range or status above.
            </p>
          </div>
        ) : null}

        {/* Ledger list */}
        <ActivityLedger
          rows={filtered}
          isPro={isPro}
          isLight={isLight}
          line={line}
          muted={muted}
        />
      </div>
    </div>
  );
}
