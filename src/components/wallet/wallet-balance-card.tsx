import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { WALLET_ACCENT as accent, type WalletData } from "./wallet-types";

const statBox = (
  label: string,
  value: string | number,
  card: string,
  ink: string,
  muted: string,
  compact = false,
) => (
  <div className={cn("rounded-xl", compact ? "p-2" : "p-3", card)}>
    <p className={cn("text-[10px] font-semibold", muted)}>{label}</p>
    <p className={cn("mt-0.5 text-[15px] font-bold", ink)}>{value}</p>
  </div>
);

export function WalletBalanceCard({
  wallet,
  card,
  ink,
  muted,
}: {
  wallet: WalletData | null;
  card: string;
  ink: string;
  muted: string;
}) {
  return (
    <div className={cn("rounded-2xl p-3", card)}>
      <p className={cn("text-[11px] font-semibold", muted)}>Available Credit</p>
      <p className="mt-0.5 text-[24px] font-black" style={{ color: accent }}>
        {formatMoney(wallet?.availableCredits ?? 0)}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {statBox(
          "Total Earned",
          `${formatMoney(wallet?.totalEarned ?? 0)}`,
          card,
          ink,
          muted,
          true,
        )}
        {statBox(
          "Pending",
          `${formatMoney(wallet?.pendingCredits ?? 0)}`,
          card,
          ink,
          muted,
          true,
        )}
        {statBox(
          "Cashable",
          `${formatMoney(wallet?.cashableCredits ?? 0)}`,
          card,
          ink,
          muted,
          true,
        )}
        {statBox(
          "Spent",
          `${formatMoney(wallet?.serviceSpendCredits ?? 0)}`,
          card,
          ink,
          muted,
          true,
        )}
      </div>
    </div>
  );
}
