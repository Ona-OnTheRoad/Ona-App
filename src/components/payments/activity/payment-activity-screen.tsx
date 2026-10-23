"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { formatMoneyMinor, type AppCurrency } from "@/lib/pricing";
import {
  isOpenStatus,
  isReleasedStatus,
  usePaymentHistory,
} from "@/lib/payments/use-payment-history";
import { useApp } from "@/lib/store";
import { PaymentsScreenHeader } from "../payments-screen-header";
import {
  periodStartMs,
  type DateFilter,
  type StatusFilter,
} from "./activity-filters";
import { ActivityStatusTabs, type StatusTabOption } from "./activity-status-tabs";
import { ActivityTimeChips } from "./activity-time-chips";
import { ActivityMoneyCard } from "./activity-money-card";
import { ActivityEmptyState } from "./activity-empty-state";
import { ActivityLedgerList } from "./activity-ledger-list";

export function PaymentActivityScreen() {
  const router = useRouter();
  const { theme, accountType } = useApp();
  const isLight = theme === "light";
  const isPro = accountType === "professional";

  const { rows, loading, error } = usePaymentHistory();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("1m");

  const handleBack = () => {
    navigateBack(router, "/settings/payments", accountType);
  };

  const statusTabs: StatusTabOption[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Open" },
    { key: "released", label: isPro ? "Paid out" : "Released" },
    { key: "refunded", label: "Refunded" },
  ];

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

  const currency = (filtered[0]?.currency || rows[0]?.currency || "NGN") as AppCurrency;
  const formattedTotal = formatMoneyMinor(periodTotalMinor, currency);

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <PaymentsScreenHeader title="Activity" onBack={handleBack} />

        <ActivityStatusTabs
          tabs={statusTabs}
          activeTab={statusFilter}
          onChange={setStatusFilter}
        />

        <ActivityTimeChips
          activeChip={dateFilter}
          onChange={setDateFilter}
        />

        <ActivityMoneyCard
          amountFormatted={formattedTotal}
          movesCount={filtered.length}
        />

        {error ? (
          <p className="py-2 text-center text-[13px] font-semibold text-red-500">
            {error}
          </p>
        ) : null}

        {loading && rows.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : filtered.length === 0 ? (
          <ActivityEmptyState />
        ) : (
          <ActivityLedgerList
            rows={filtered}
            isPro={isPro}
            isLight={isLight}
          />
        )}
      </div>
    </div>
  );
}
