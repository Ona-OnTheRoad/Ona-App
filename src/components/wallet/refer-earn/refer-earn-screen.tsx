"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useWallet } from "../use-wallet";
import { ReferEarnHeader } from "./refer-earn-header";
import { AvailableCreditCard } from "./available-credit-card";
import { ReferralCodeCard } from "./referral-code-card";
import { CashoutCard } from "./cashout-card";
import { HistoryTabSwitcher, type HistoryTab } from "./history-tab-switcher";
import { HistoryCard } from "./history-card";

interface ReferEarnScreenProps {
  isLight?: boolean;
}

export function ReferEarnScreen({ isLight: _propIsLight }: ReferEarnScreenProps) {
  const router = useRouter();
  const { backendUserId, accountType } = useApp();

  const w = useWallet(backendUserId);
  const [activeTab, setActiveTab] = useState<HistoryTab>("referral");

  const handleBack = () => {
    navigateBack(router, "/profile", accountType);
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <ReferEarnHeader onBack={handleBack} />

        {w.loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-brand" />
          </div>
        ) : !backendUserId ? (
          <div className="rounded-ona-ctl border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-8 text-center text-ona-muted">
            <p className="text-[12px] font-medium">
              Sign in to view your referral & earnings
            </p>
          </div>
        ) : (
          <>
            <AvailableCreditCard wallet={w.wallet} />

            <ReferralCodeCard
              referralCode={w.referral?.code.referralCode || ""}
              copied={w.copied}
              onCopy={w.handleCopy}
            />

            <CashoutCard
              amount={w.cashoutAmount}
              onAmountChange={w.setCashoutAmount}
              busy={w.cashoutBusy}
              msg={w.cashoutMsg}
              onRequest={w.handleCashout}
            />

            <HistoryTabSwitcher
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <HistoryCard
              activeTab={activeTab}
              referralEvents={w.referral?.events}
              txs={w.txs}
            />
          </>
        )}
      </div>
    </div>
  );
}
