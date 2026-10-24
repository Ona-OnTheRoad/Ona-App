"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReferEarnScreen } from "@/components/wallet/refer-earn";
import { PaymentsHubScreen } from "@/components/payments/hub/payments-hub-screen";

function WalletContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  if (view === "payouts") {
    return <PaymentsHubScreen />;
  }

  return <ReferEarnScreen />;
}

export default function WalletPage() {
  return (
    <Suspense
      fallback={
        <div className="ona2 flex h-full items-center justify-center bg-ona-bg text-sm font-semibold text-ona-muted">
          Loading…
        </div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
