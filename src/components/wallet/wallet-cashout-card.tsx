import { ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { WALLET_ACCENT as accent } from "./wallet-types";

export function WalletCashoutCard({
  amount,
  onAmountChange,
  busy,
  msg,
  onRequest,
  isLight,
  card,
  ink,
  muted,
}: {
  amount: string;
  onAmountChange: (v: string) => void;
  busy: boolean;
  msg: string | null;
  onRequest: () => void;
  isLight: boolean;
  card: string;
  ink: string;
  muted: string;
}) {
  return (
    <div className={cn("rounded-2xl p-3", card)}>
      <div className="flex items-center gap-1.5">
        <ArrowUpRight className="h-4 w-4" style={{ color: accent }} />
        <p className={cn("text-[13px] font-bold", ink)}>Cash Out</p>
      </div>
      <p className={cn("mt-0.5 text-[10px] font-medium", muted)}>
        {"Convert eligible credits to cash. Minimum "}
        {formatMoney(2000)}.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className={cn(
            "flex-1 rounded-xl border-0 px-3 py-2 text-[13px] font-semibold outline-none",
            isLight ? "bg-slate-100 text-black" : "bg-black/40 text-white",
          )}
        />
        <button
          type="button"
          disabled={busy || !amount}
          onClick={onRequest}
          className="h-10 rounded-xl border-0 px-4 text-[12px] font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          {busy ? "..." : "Request"}
        </button>
      </div>
      {msg ? (
        <p
          className={cn(
            "mt-1 text-[10px] font-medium",
            msg.includes("submitted") ? "text-green-500" : "text-red-500",
          )}
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
