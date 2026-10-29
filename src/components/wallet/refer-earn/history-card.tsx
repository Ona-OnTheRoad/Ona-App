"use client";

import Image from "next/image";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
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

function getInitials(name?: string) {
  if (!name) return "PH";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatRelativeOrDate(isoString: string) {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) return "Today";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Today";
  }
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
      tx.transactionType.toLowerCase().includes("withdrawal") ||
      tx.transactionType.toLowerCase().includes("credit"),
  );

  const hasItems =
    activeTab === "referral" ? referralEvents.length > 0 : cashoutTxs.length > 0;

  return (
    <div
      className={cn(
        "rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent transition-colors shadow-2xs overflow-hidden",
        !hasItems && "p-6 min-h-80 flex flex-col items-center justify-center text-center",
      )}
    >
      {!hasItems ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          {/* Empty state illustration */}
          <div className="relative w-40 h-44 flex items-center justify-center mb-1">
            <Image
              src="/images/no-history.png"
              alt="No history yet"
              width={140}
              height={170}
              className="object-contain"
              priority
            />
          </div>

          <h3 className="text-[15px] font-bold text-ona-ink">
            No history yet
          </h3>

          <p className="text-[12px] text-ona-muted mt-1">
            Your history will appear here.
          </p>
        </div>
      ) : activeTab === "referral" ? (
        <div className="divide-y divide-ona-border dark:divide-[#18181B]">
          {referralEvents.map((evt) => {
            const evtRecord = evt as unknown as Record<string, unknown>;
            const name =
              (evtRecord.referredUserName as string) ||
              (evtRecord.referredUserPhone as string) ||
              "Referral Friend";
            const dateStr = formatRelativeOrDate(evt.createdAt);
            const initials = getInitials(name);

            return (
              <div
                key={evt.id}
                className="flex items-center gap-3.5 p-3.5 hover:bg-black/1 dark:hover:bg-white/2 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ona-field border border-ona-border text-[12px] font-bold text-ona-muted">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-ona-ink leading-tight truncate">
                    {name}
                  </p>
                  <p className="text-[11px] text-ona-muted leading-tight mt-0.5">
                    {dateStr}
                  </p>
                </div>
                {evt.rewardAmount > 0 && (
                  <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    +{formatMoney(evt.rewardAmount)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-ona-border dark:divide-[#18181B]">
          {cashoutTxs.map((tx) => {
            const txRecord = tx as unknown as Record<string, unknown>;
            const isCredit =
              tx.transactionType.toLowerCase().includes("credit") ||
              tx.transactionType.toLowerCase().includes("deposit");
            const title =
              (txRecord.description as string) ||
              tx.reason ||
              (isCredit ? "Auto-Recharge Credit" : "Cash Out Request");
            const subtitle = `${formatRelativeOrDate(tx.createdAt)} · ${tx.status}`;

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 hover:bg-black/1 dark:hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      isCredit
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400",
                    )}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="h-4 w-4" strokeWidth={2.4} />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ona-ink leading-tight truncate">
                      {title}
                    </p>
                    <p className="text-[11px] text-ona-muted leading-tight mt-0.5 truncate">
                      {subtitle}
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "text-[13px] font-bold shrink-0",
                    isCredit
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {isCredit ? "+" : "-"}
                  {formatMoney(tx.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
