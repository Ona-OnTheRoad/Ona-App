"use client";

import { useApp } from "@/lib/store";
import { ReferEarnScreen } from "@/components/wallet/refer-earn";
import { PaymentsHubScreen } from "@/components/payments/hub/payments-hub-screen";

/**
 * Payouts / Wallet page:
 * - Repair Pro (dock → Payouts): Payments & Payouts hub (Overview, Bank, Activity)
 * - Motorist: Refer & Earn screen
 */
export default function WalletPage() {
  const { accountType } = useApp();

  if (accountType === "professional") {
    return <PaymentsHubScreen />;
  }

  return <ReferEarnScreen />;
}
