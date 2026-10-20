"use client";

import Image from "next/image";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { HistoryTab } from "./history-tab-switcher";
import type { ReferralData, TxData } from "../wallet-types";

interface HistoryCardProps {
  activeTab: HistoryTab;
  referralEvents?: ReferralData["events"];
  txs?: TxData;
  isLight?: boolean;
}

export function HistoryCard({
  activeTab,
  referralEvents = [],
  txs = [],
}: HistoryCardProps) {
  const cashoutTxs = txs.filter(
    (tx) =>
      tx.transactionType === "cashout" ||
      tx.transactionType.toLowerCase().includes("cash") ||
      tx.transactionType.toLowerCase().includes("withdrawal"),
  );

  const hasItems =
    activeTab === "referral" ? referralEvents.length > 0 : cashoutTxs.length > 0;

  return (
    <div
      className={cn(
        "rounded-ona-ctl border border-ona-border bg-ona-surface p-6 min-h-80 shadow-2xs transition-colors flex flex-col",
        !hasItems && "items-center justify-center text-center",
      )}
    >
      {!hasItems ? (
        <div className="flex flex-col items-center justify-center py-6">
          {/* Empty state illustration */}
          <div className="relative w-44 h-48 flex items-center justify-center mb-1">
            <div className="w-40 h-40 rounded-full flex items-center justify-center overflow-hidden bg-ona-field">
              <Image
                src="/images/no-history.png"
                alt="No history yet"
                width={130}
                height={160}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h3 className="text-[16px] font-semibold mt-2 text-ona-ink">
            No history yet
          </h3>

          <p className="text-[12px] mt-1 text-ona-muted">
            Your history will appear here.
          </p>
        </div>
      ) : activeTab === "referral" ? (
        <div className="w-full space-y-2">
          {referralEvents.map((evt) => (
            <div
              key={evt.id}
              className="flex items-center justify-between p-3 rounded-ona-ctl border border-ona-border bg-ona-field transition-colors"
            >
              <div>
                <p className="text-[13px] font-semibold text-ona-ink">
                  Referral Reward
                </p>
                <p className="text-[11px] capitalize mt-0.5 text-ona-muted">
                  {new Date(evt.createdAt).toLocaleDateString()} · {evt.status}
                </p>
              </div>
              <p className="text-[13px] font-bold text-ona-success">
                +{formatMoney(evt.rewardAmount)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full space-y-2">
          {cashoutTxs.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-ona-ctl border border-ona-border bg-ona-field transition-colors"
            >
              <div>
                <p className="text-[13px] font-semibold text-ona-ink">
                  Cash Out Request
                </p>
                <p className="text-[11px] capitalize mt-0.5 text-ona-muted">
                  {new Date(tx.createdAt).toLocaleDateString()} · {tx.status}
                </p>
              </div>
              <p className="text-[13px] font-bold text-brand">
                -{formatMoney(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
