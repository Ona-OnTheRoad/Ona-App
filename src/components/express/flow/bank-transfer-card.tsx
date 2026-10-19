import { Loader2, Lock } from "lucide-react";
import { useExactCountdown } from "@/lib/jobs/use-exact-countdown";
import { cn } from "@/lib/utils";
import { naira } from "./helpers";
import { DetailRow } from "./price-rows";
import type { BankPay, ExpressTheme } from "./types";

/** mm:ss pay-window countdown, turns red under 15s (mirrors checkout). */
function PayCountdown({ deadline }: { deadline: string }) {
  const { displayMs } = useExactCountdown(deadline);
  const secs = Math.max(0, Math.ceil(displayMs / 1000));
  const label = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <span
      className={cn(
        "text-[12px] font-bold tabular-nums",
        secs <= 15_000 ? "text-red-500" : "text-[#FF6B35]",
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
  const { ink, muted, rowCard } = theme;
  return (
    <div className={cn("rounded-[4px] px-3 py-3", rowCard)}>
      <div className="mb-2 flex items-center justify-between">
        <span
          className={cn(
            "flex items-center gap-1.5 text-[13px] font-extrabold",
            ink,
          )}
        >
          <Lock className="h-4 w-4 text-[#FF6B35]" />
          Bank transfer
        </span>
        <PayCountdown deadline={bankPay.sessionEndsAt} />
      </div>
      <DetailRow label="Account name" value={bankPay.accountName} ink={ink} />
      <button
        type="button"
        onClick={() => onCopyNumber(bankPay.accountNumber)}
        className="flex w-full items-center justify-between gap-2 border-0 bg-transparent py-1.5 text-left"
        aria-label="Copy account number"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-60">
            Account number · tap to copy
          </span>
          <span
            className={cn(
              "block truncate text-[14px] font-bold tabular-nums",
              ink,
            )}
          >
            {bankPay.accountNumber}
          </span>
        </span>
      </button>
      <DetailRow label="Bank" value={bankPay.bankName} ink={ink} />
      <DetailRow label="Amount" value={naira(bankPay.amountMajor)} ink={ink} />
      <p
        className={cn(
          "mt-2 flex items-center gap-1.5 px-0.5 text-[11px] font-medium",
          muted,
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        Transfer the exact amount only. Waiting for your payment…
      </p>
    </div>
  );
}
