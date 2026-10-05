import { badge } from "./types";
import type { AdminRow, OnAction } from "./types";

export function ReferralsTab({
  refEvents,
  onAction,
}: {
  refEvents: AdminRow[];
  onAction: OnAction;
}) {
  return (
    <div className="space-y-3">
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-[var(--om-border)] text-[11px] font-semibold text-[var(--om-text-muted)]">
            <th className="p-2">Referrer</th>
            <th className="p-2">Referred</th>
            <th className="p-2">Reward</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {refEvents.map((ev) => (
            <tr
              key={String(ev.id)}
              className="border-b border-[var(--om-border-soft)]"
            >
              <td className="p-2 font-medium">
                {String(ev.referrerUserId ?? "").slice(0, 8)}
              </td>
              <td className="p-2">
                {String(ev.referredUserId ?? "").slice(0, 8)}
              </td>
              <td className="p-2">₦{ev.rewardAmount}</td>
              <td className="p-2">
                <span
                  className={badge(
                    ev.status === "approved"
                      ? "bg-green-50 text-green-700"
                      : ev.status === "rejected"
                        ? "bg-red-50 text-red-700"
                        : "bg-yellow-50 text-yellow-700",
                  )}
                >
                  {ev.status}
                </span>
              </td>
              <td className="p-2">
                <div className="flex gap-1">
                  {ev.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onAction("approve-referral", {
                            id: ev.id,
                            rewardAmount: 500,
                            reason: "Approved",
                          })
                        }
                        className="rounded bg-green-500 px-2 py-1 text-[10px] font-bold text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAction("reject-referral", {
                            id: ev.id,
                            reason: "Rejected",
                          })
                        }
                        className="rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onAction("reverse-referral", {
                          id: ev.id,
                          reason: "Reversed",
                        })
                      }
                      className="rounded bg-orange-500 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Reverse
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {refEvents.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="p-4 text-center text-[var(--om-text-muted)]"
              >
                No referrals
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
