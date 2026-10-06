import { cn } from "@/lib/utils";
import { card } from "./types";

export function OverviewTab({
  stats,
}: {
  stats: Record<string, string | number | undefined>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [
            "Total Contact Changes",
            stats.totalChangeRequests ?? "",
            "bg-blue-50 text-blue-700",
          ],
          [
            "Pending Changes",
            stats.pendingChangeRequests ?? 0,
            "bg-yellow-50 text-yellow-700",
          ],
          [
            "Open Fraud Flags",
            stats.openFraudFlags ?? 0,
            "bg-red-50 text-red-700",
          ],
          [
            "Audit Events Today",
            stats.auditEventsToday ?? 0,
            "bg-purple-50 text-purple-700",
          ],
          [
            "Active Sessions",
            stats.activeSessions ?? "",
            "bg-green-50 text-green-700",
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
