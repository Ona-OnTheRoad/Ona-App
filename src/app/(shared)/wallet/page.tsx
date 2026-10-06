"use client";

import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WalletBalanceCard } from "@/components/wallet/wallet-balance-card";
import { WalletCashoutCard } from "@/components/wallet/wallet-cashout-card";
import { WalletHistoryCard } from "@/components/wallet/wallet-history-card";
import { WalletReferralCard } from "@/components/wallet/wallet-referral-card";
import { WALLET_ACCENT as accent } from "@/components/wallet/wallet-types";
import { useWallet } from "@/components/wallet/use-wallet";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function WalletPage() {
  const { theme, backendUserId } = useApp();
  const isLight = theme === "light";
  const t = useT();

  const w = useWallet(backendUserId);

  const bg = isLight ? "bg-[#c8c9cd]" : "bg-black";
  const card = isLight ? "bg-white" : "bg-[#1c1c1e]";
  const ink = isLight ? "text-black" : "text-white";
  const muted = isLight ? "text-slate-600" : "text-white/60";

  return (
    <div className={cn("flex h-full flex-col", bg)}>
      <PageHeader title="Refer & Earn" />
      <div className="flex-1 overflow-hidden px-4 pb-4">
        {w.loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              className="h-6 w-6 animate-spin"
              style={{ color: accent }}
            />
          </div>
        ) : !backendUserId ? (
          <div className="flex items-center justify-center py-20">
            <p className={cn("text-[13px] font-medium", muted)}>
              Sign in to view your referral & earnings
            </p>
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            <WalletBalanceCard
              wallet={w.wallet}
              card={card}
              ink={ink}
              muted={muted}
            />
            <WalletReferralCard
              referral={w.referral}
              copied={w.copied}
              onCopy={w.handleCopy}
              isLight={isLight}
              card={card}
              ink={ink}
              muted={muted}
            />
            <WalletCashoutCard
              amount={w.cashoutAmount}
              onAmountChange={w.setCashoutAmount}
              busy={w.cashoutBusy}
              msg={w.cashoutMsg}
              onRequest={w.handleCashout}
              isLight={isLight}
              card={card}
              ink={ink}
              muted={muted}
            />
            <WalletHistoryCard
              txs={w.txs}
              isLight={isLight}
              card={card}
              ink={ink}
              muted={muted}
            />
          </div>
        )}
      </div>
    </div>
  );
}
