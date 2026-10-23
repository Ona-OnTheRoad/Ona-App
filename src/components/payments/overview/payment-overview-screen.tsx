"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { formatMoneyMinor, type AppCurrency } from "@/lib/pricing";
import { usePaymentHistory } from "@/lib/payments/use-payment-history";
import { useApp } from "@/lib/store";
import { PaymentsScreenHeader } from "../payments-screen-header";
import { OverviewBalanceHeader } from "./overview-balance-header";
import { MoneyHeldCard } from "./money-held-card";
import { BalanceBreakdownCard, type BreakdownRowItem } from "./balance-breakdown-card";
import { PaymentDisclaimerCard } from "./payment-disclaimer-card";

export function PaymentOverviewScreen() {
  const router = useRouter();
  const { accountType } = useApp();
  const isPro = accountType === "professional";

  const { summary, loading, error, reload, rows } = usePaymentHistory();

  const handleBack = () => {
    navigateBack(router, "/settings/payments", accountType);
  };

  const title = isPro ? "Payout overview" : "Payment overview";
  const eyebrowLabel = isPro ? "Repair Pro balance" : "Customer balance";
  const currency = (rows[0]?.currency || "NGN") as AppCurrency;

  const heroLabel = isPro ? "Money held for you (NGN)" : "Money held now (NGN)";
  const heroAmount = summary ? summary.heldMinor : 0;
  const heroFormatted = formatMoneyMinor(heroAmount, currency);

  const openCount = summary ? summary.heldCount + summary.processingCount : 0;
  const heroSubtext =
    openCount === 0
      ? isPro
        ? "No payout waiting right now"
        : "No payment waiting right now"
      : isPro
        ? `${openCount} payout${openCount === 1 ? "" : "s"} still open`
        : `${openCount} payment${openCount === 1 ? "" : "s"} still open`;

  const releasedCount = summary?.releasedCount || 0;
  const refundedCount = summary?.refundedCount || 0;
  const totalCount = summary?.totalCount || 0;
  const releasedAmount = summary?.releasedMinor || 0;

  const breakdownRows: BreakdownRowItem[] = [
    {
      label: isPro ? "Paid to your bank" : "Released",
      sub: isPro
        ? `${releasedCount} payout${releasedCount === 1 ? "" : "s"} done`
        : `${releasedCount} job${releasedCount === 1 ? "" : "s"} done`,
      value: formatMoneyMinor(releasedAmount, currency),
      isBrandColor: true,
    },
    {
      label: "Still open",
      sub:
        openCount === 0
          ? "Nothing waiting"
          : `${openCount} job${openCount === 1 ? "" : "s"} in progress`,
      value: formatMoneyMinor(heroAmount, currency),
      isBrandColor: true,
    },
    {
      label: "Refunded",
      sub:
        refundedCount === 0
          ? "No refunds"
          : `${refundedCount} refund${refundedCount === 1 ? "" : "s"}`,
      value: String(refundedCount),
      isBrandColor: false,
    },
    {
      label: "Total moves",
      sub: "All time on this role",
      value: String(totalCount),
      isBrandColor: false,
    },
  ];

  const disclaimerText = isPro
    ? "We hold customer payments safely in escrow until you complete the job. Payouts are made directly to your verified bank account."
    : "We hold your money until you say the job is done. Refunds are handled by Ona support.";

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <PaymentsScreenHeader title={title} onBack={handleBack} />

        <OverviewBalanceHeader
          label={eyebrowLabel}
          isRefreshing={loading}
          onRefresh={() => void reload()}
        />

        {error ? (
          <p className="py-2 text-center text-[13px] font-semibold text-red-500">
            {error}
          </p>
        ) : null}

        {loading && !summary ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : (
          <>
            <MoneyHeldCard
              label={heroLabel}
              amountFormatted={heroFormatted}
              subtext={heroSubtext}
            />

            <BalanceBreakdownCard rows={breakdownRows} />

            <PaymentDisclaimerCard message={disclaimerText} />
          </>
        )}
      </div>
    </div>
  );
}
