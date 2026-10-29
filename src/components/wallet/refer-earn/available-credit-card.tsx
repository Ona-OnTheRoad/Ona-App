"use client";

import { formatMoney } from "@/lib/pricing";
import type { WalletData } from "../wallet-types";

interface AvailableCreditCardProps {
  wallet: WalletData | null;
  isLight?: boolean;
}

export function AvailableCreditCard({
  wallet,
}: AvailableCreditCardProps) {
  const available = formatMoney(wallet?.availableCredits ?? 0);
  const totalEarned = formatMoney(wallet?.totalEarned ?? 0);
  const pending = formatMoney(wallet?.pendingCredits ?? 0);
  const cashable = formatMoney(wallet?.cashableCredits ?? 0);
  const spent = formatMoney(wallet?.serviceSpendCredits ?? 0);

  return (
    <div className="rounded-ona-ctl border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4 shadow-2xs transition-colors">
      <p className="text-[11px] font-bold tracking-wider uppercase mb-1 text-ona-muted">
        Available Credit
      </p>

      {/* Large brand orange balance */}
      <p className="text-[24px] font-extrabold tracking-tight text-brand mb-3">
        {available}
      </p>

      {/* 4-column breakdown strip */}
      <div className="rounded-ona-ctl bg-ona-field py-2.5 px-1 grid grid-cols-4 divide-x divide-ona-border dark:divide-[#18181B]">
        {/* Total earned */}
        <div className="text-center px-1">
          <p className="text-[12px] font-bold truncate text-ona-ink">
            {totalEarned}
          </p>
          <p className="text-[10px] font-normal mt-0.5 truncate text-ona-muted">
            Total earned
          </p>
        </div>

        {/* Pending */}
        <div className="text-center px-1">
          <p className="text-[12px] font-bold truncate text-ona-ink">
            {pending}
          </p>
          <p className="text-[10px] font-normal mt-0.5 truncate text-ona-muted">
            Pending
          </p>
        </div>

        {/* Cashable */}
        <div className="text-center px-1">
          <p className="text-[12px] font-bold truncate text-ona-ink">
            {cashable}
          </p>
          <p className="text-[10px] font-normal mt-0.5 truncate text-ona-muted">
            Cashable
          </p>
        </div>

        {/* Spent */}
        <div className="text-center px-1">
          <p className="text-[12px] font-bold truncate text-ona-ink">
            {spent}
          </p>
          <p className="text-[10px] font-normal mt-0.5 truncate text-ona-muted">
            Spent
          </p>
        </div>
      </div>
    </div>
  );
}
