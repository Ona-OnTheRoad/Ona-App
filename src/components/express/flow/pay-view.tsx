import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BankTransferCard } from "./bank-transfer-card";
import { PayFooter } from "./pay-footer";
import { QuoteSummary } from "./quote-summary";
import type { BankPay, ExpressTheme, Quote } from "./types";

type Props = {
  theme: ExpressTheme;
  quote: Quote;
  bankPay: BankPay | null;
  busy: boolean;
  onCopyNumber: (accountNumber: string) => void;
  cancelAsk: boolean;
  cancelBusy: boolean;
  setCancelAsk: (v: boolean) => void;
  onCancel: (mode: "payment" | "both") => void;
};

/** Pay stage: opening spinner, price summary, bank details, cancel footer. */
export function PayView({
  theme,
  quote,
  bankPay,
  busy,
  onCopyNumber,
  cancelAsk,
  cancelBusy,
  setCancelAsk,
  onCancel,
}: Props) {
  return (
    <>
      {!bankPay && !busy ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
          <p className={cn("text-[13px] font-medium", theme.muted)}>
            Opening secure payment…
          </p>
        </div>
      ) : null}
      <div>
        <QuoteSummary theme={theme} quote={quote} />
        {bankPay ? (
          <BankTransferCard
            theme={theme}
            bankPay={bankPay}
            onCopyNumber={onCopyNumber}
          />
        ) : null}
      </div>
      <PayFooter
        theme={theme}
        cancelAsk={cancelAsk}
        cancelBusy={cancelBusy}
        setCancelAsk={setCancelAsk}
        onCancel={onCancel}
      />
    </>
  );
}
