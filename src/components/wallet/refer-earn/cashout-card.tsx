"use client";

import { cn } from "@/lib/utils";

interface CashoutCardProps {
  amount: string;
  onAmountChange: (val: string) => void;
  busy: boolean;
  msg: string | null;
  onRequest: () => void;
  isLight?: boolean;
}

export function CashoutCard({
  amount,
  onAmountChange,
  busy,
  msg,
  onRequest,
}: CashoutCardProps) {
  const numericAmount = Number(amount);
  const isValid = Boolean(amount && numericAmount >= 2000);

  return (
    <div className="rounded-ona-ctl border border-ona-border bg-ona-surface p-4 shadow-2xs transition-colors">
      <p className="text-[11px] font-bold tracking-wider uppercase mb-1 text-ona-muted">
        Cash Out
      </p>

      <p className="text-[12px] leading-normal mb-3 text-ona-muted">
        Convert eligible credits to cash. Minimum ₦2,000.
      </p>

      <div className="border-t border-ona-border pt-3 mb-1" />

      {/* Input + Request button row */}
      <div className="flex items-center gap-3">
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          inputMode="numeric"
          className="w-2/3 rounded-ona-ctl border border-ona-border bg-ona-field px-4 py-3 text-[12px] font-normal text-ona-ink placeholder:text-ona-muted transition-colors focus:outline-none focus:border-ona-ink"
        />

        <button
          type="button"
          disabled={busy || !amount}
          onClick={onRequest}
          className={cn(
            "rounded-ona-ctl px-6 py-3 text-[12px] font-medium transition-all shadow-xs shrink-0",
            isValid && !busy
              ? "bg-brand text-white hover:opacity-90 cursor-pointer active:scale-95"
              : "bg-ona-disabled-bg text-ona-disabled-ink cursor-not-allowed",
          )}
        >
          {busy ? "Requesting…" : "Request"}
        </button>
      </div>

      {msg ? (
        <div
          className={cn(
            "mt-3 rounded-ona-ctl p-2.5 text-[12px] font-medium leading-snug border",
            msg.toLowerCase().includes("submitted") ||
              msg.toLowerCase().includes("success")
              ? "bg-ona-success-soft text-ona-success border-ona-success/30"
              : "bg-red-50 dark:bg-red-950/30 text-ona-danger border-ona-danger/30",
          )}
        >
          {msg}
        </div>
      ) : null}
    </div>
  );
}
