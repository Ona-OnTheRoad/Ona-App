import { History } from "lucide-react";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { WALLET_ACCENT as accent, type TxData } from "./wallet-types";

export function WalletHistoryCard({
  txs,
  isLight,
  card,
  ink,
  muted,
}: {
  txs: TxData;
  isLight: boolean;
  card: string;
  ink: string;
  muted: string;
}) {
  return (
    <div className={cn("rounded-2xl p-3", card)}>
      <div className="flex items-center gap-1.5">
        <History className="h-4 w-4" style={{ color: accent }} />
        <p className={cn("text-[13px] font-bold", ink)}>History</p>
      </div>
      {txs.length === 0 ? (
        <p className={cn("mt-1 text-[11px]", muted)}>No transactions yet.</p>
      ) : (
        <div className="mt-2 space-y-1.5">
          {txs.slice(0, 20).map((tx) => (
            <div
              key={tx.id}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2",
                isLight ? "bg-slate-50" : "bg-black/30",
              )}
            >
              <div>
                <p className={cn("text-[11px] font-semibold capitalize", ink)}>
                  {tx.transactionType.replace("_", " ")}
                </p>
                <p className={cn("text-[9px]", muted)}>
                  {new Date(tx.createdAt).toLocaleDateString()}
                  {tx.reason ? ` · ${tx.reason}` : ""}
                </p>
              </div>
              <p
                className={cn(
                  "text-[12px] font-bold",
                  tx.amount > 0 ? "text-green-500" : "text-red-400",
                )}
              >
                {tx.amount > 0 ? "+" : ""}
                {formatMoney(tx.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
