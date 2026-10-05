import { cn } from "@/lib/utils";
import { badge, card } from "./types";
import type { AdminRow, OnAction } from "./types";

export function CreditsTab({
  txs,
  onAction,
}: {
  txs: AdminRow[];
  onAction: OnAction;
}) {
  return (
    <div className="space-y-3">
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-[var(--om-border)] text-[11px] font-semibold text-[var(--om-text-muted)]">
            <th className="p-2">User</th>
            <th className="p-2">Type</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Status</th>
            <th className="p-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((tx) => (
            <tr
              key={String(tx.id)}
              className="border-b border-[var(--om-border-soft)]"
            >
              <td className="p-2 font-medium">
                {String(tx.userId ?? "").slice(0, 8)}
              </td>
              <td className="p-2 capitalize">
                {String(tx.transactionType ?? "").replace("_", " ")}
              </td>
              <td className="p-2">
                ₦{Number(tx.amount ?? 0).toLocaleString()}
              </td>
              <td className="p-2">
                <span
                  className={badge(
                    tx.status === "completed"
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700",
                  )}
                >
                  {tx.status}
                </span>
              </td>
              <td className="p-2 text-[var(--om-text-muted)]">
                {new Date(String(tx.createdAt ?? "")).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {txs.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="p-4 text-center text-[var(--om-text-muted)]"
              >
                No transactions
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className={cn(card, "mt-4")}>
        <p className="mb-2 text-[13px] font-bold">Adjust Balance</p>
        <div className="flex gap-2">
          <input
            id="adj-user"
            placeholder="User ID"
            className="flex-1 rounded-lg border border-[var(--om-border)] bg-[var(--om-input)] px-3 py-2 text-[12px] outline-none"
          />
          <input
            id="adj-amount"
            type="number"
            placeholder="Amount (+/-)"
            className="w-32 rounded-lg border border-[var(--om-border)] bg-[var(--om-input)] px-3 py-2 text-[12px] outline-none"
          />
          <button
            type="button"
            onClick={() => {
              const u = (
                document.getElementById("adj-user") as HTMLInputElement
              )?.value;
              const a = Number(
                (document.getElementById("adj-amount") as HTMLInputElement)
                  ?.value,
              );
              if (u && a)
                onAction("adjust-balance", {
                  userId: u,
                  amount: a,
                  reason: "Admin adjustment",
                });
            }}
            className="rounded-lg bg-[var(--om-accent)] px-4 py-2 text-[12px] font-bold text-white"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
