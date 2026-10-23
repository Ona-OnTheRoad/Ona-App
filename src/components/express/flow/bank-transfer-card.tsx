import { Copy } from "lucide-react";
import { useExactCountdown } from "@/lib/jobs/use-exact-countdown";
import { cn } from "@/lib/utils";
import { naira } from "./helpers";
import type { BankPay, ExpressTheme } from "./types";

/** mm:ss pay-window countdown, turns red under 15s (mirrors checkout). */
function PayCountdown({ deadline }: { deadline: string }) {
  const { displayMs } = useExactCountdown(deadline);
  const secs = Math.max(0, Math.ceil(displayMs / 1000));
  const label = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <span
      className={cn(
        "text-[13px] font-semibold tabular-nums",
        secs <= 15 ? "text-red-500" : "text-[#FF6B35]",
      )}
    >
      {label}
    </span>
  );
}

type Props = {
  theme: ExpressTheme;
  bankPay: BankPay;
  onCopyNumber: (accountNumber: string) => void;
};

export function BankTransferCard({ theme, bankPay, onCopyNumber }: Props) {
  const { ink } = theme;

  return (
    <div className="mt-3">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3.5 flex items-center justify-between">
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-wider text-gray-900 dark:text-white",
              ink,
            )}
          >
            Bank Transfer
          </span>
          <PayCountdown deadline={bankPay.sessionEndsAt} />
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Account name */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-400">
              Account name
            </span>
            <span
              className={cn(
                "text-[13px] font-semibold text-gray-900 dark:text-white",
                ink,
              )}
            >
              {bankPay.accountName || "Ona"}
            </span>
          </div>

          {/* Account number */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-400">
              Account number
            </span>
            <button
              type="button"
              onClick={() => onCopyNumber(bankPay.accountNumber)}
              className="flex items-center gap-1.5 border-0 bg-transparent p-0 text-left cursor-pointer group"
              aria-label="Copy account number"
            >
              <span
                className={cn(
                  "text-[13px] font-semibold tabular-nums text-gray-900 dark:text-white group-hover:text-[#FF6B35] transition-colors",
                  ink,
                )}
              >
                {bankPay.accountNumber}
              </span>
              <Copy
                className="h-3.5 w-3.5 text-[#FF6B35] transition-transform group-active:scale-90"
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>

          {/* Bank */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-400">
              Bank
            </span>
            <span
              className={cn(
                "text-[13px] font-semibold text-gray-900 dark:text-white text-right",
                ink,
              )}
            >
              {bankPay.bankName}
            </span>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider text-gray-900 dark:text-white",
                ink,
              )}
            >
              Amount
            </span>
            <span
              className={cn(
                "text-[14px] font-bold text-gray-900 dark:text-white",
                ink,
              )}
            >
              {naira(bankPay.amountMajor)}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-zinc-500">
        Transfer the exact amount only. Waiting for your payment
      </p>
    </div>
  );
}
