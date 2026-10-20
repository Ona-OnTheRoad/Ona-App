"use client";

import { useRouter } from "next/navigation";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { PaymentsScreenHeader } from "../payments-screen-header";
import { PaymentsHubMenuCard, type PaymentsHubMenuItem } from "./payments-hub-menu-card";

export function PaymentsHubScreen() {
  const router = useRouter();
  const { accountType } = useApp();
  const isPro = accountType === "professional";

  const handleBack = () => {
    navigateBack(router, "/profile", accountType);
  };

  const title = isPro ? "Payments & Payouts" : "Payments & Refunds";

  const menuItems: PaymentsHubMenuItem[] = [
    {
      title: isPro ? "Payout overview" : "Payment overview",
      subtitle: isPro ? "Money held and paid out" : "Money held and released",
      href: "/settings/payments/overview",
    },
    {
      title: "Bank account details",
      subtitle: isPro ? "Where you get paid" : "Where refunds go",
      href: "/settings/payments/bank",
    },
    {
      title: "Activity",
      subtitle: "Past money moves",
      href: "/settings/payments/activity",
    },
  ];

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-5">
        <PaymentsScreenHeader title={title} onBack={handleBack} />
        <PaymentsHubMenuCard items={menuItems} />
      </div>
    </div>
  );
}
