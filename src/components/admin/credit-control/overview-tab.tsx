import { cn } from "@/lib/utils";
import { card } from "./types";

export function OverviewTab({
  stats,
}: {
  stats: Record<string, string | number | undefined>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[
          [
            "Referral Rewards Issued",
            `₦${(stats.totalReferralRewards ?? 0).toLocaleString()}`,
            "bg-green-50 text-green-700",
          ],
          [
            "Total Credits Earned",
            `₦${(stats.totalCreditsEarned ?? 0).toLocaleString()}`,
            "bg-teal-50 text-teal-700",
          ],
          [
            "Pending Cashouts",
            stats.pendingCashouts ?? 0,
            "bg-orange-50 text-orange-700",
          ],
          [
            "Active Wallets",
            stats.activeWallets ?? "",
            "bg-blue-50 text-blue-700",
          ],
          [
            "Approval Queue",
            stats.approvalQueueCount ?? 0,
            "bg-indigo-50 text-indigo-700",
          ],
        ].map(([label, value, cls]) => (
          <div key={String(label)} className={cn(card)}>
            <p className="text-[11px] font-semibold text-[var(--om-text-muted)]">
              {String(label)}
            </p>
            <p className={cn("mt-1 text-[22px] font-bold", cls)}>
              {String(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
