import { badge } from "./types";
import type { AdminRow, OnAction } from "./types";

export function CashoutsTab({
  cashoutList,
  onAction,
}: {
  cashoutList: AdminRow[];
  onAction: OnAction;
}) {
  return (
    <div className="space-y-3">
      {/* Hint & tips, how the cashout engine works */}
      <div className="rounded border border-[var(--om-border)] bg-[var(--om-surface,#f8f8fa)] p-3 text-[11px] leading-relaxed text-[var(--om-text-muted)]">
        <p className="font-bold text-[var(--om-text)]">💡 How cashouts work</p>
        <p className="mt-1">
          <b>Approve</b> starts an automatic Flutterwave bank transfer to the
          user&apos;s verified bank, no manual payment needed. Watch the Status
          column: <b>processing</b> means the transfer is retrying every 10
          minutes (Flutterwave balance low); it completes on its own.
          <b> failed</b> means the money was returned to the user&apos;s wallet
          automatically. <b>Retry</b> re-attempts now; <b>Force fail</b> returns
          the funds and closes the request (needs access code). Use{" "}
          <b>Mark Paid</b> only if you paid the user outside Ona, it requires
          your access code and is logged.
        </p>
        <p className="mt-1">
          Tips: limits, fees and auto-approve threshold live in the Settings
          tab, change them anytime, no developer needed.
        </p>
      </div>
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-[var(--om-border)] text-[11px] font-semibold text-[var(--om-text-muted)]">
            <th className="p-2">User</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Fee</th>
            <th className="p-2">Net</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cashoutList.map((c) => (
            <tr
              key={String(c.id)}
              className="border-b border-[var(--om-border-soft)]"
            >
              <td className="p-2 font-medium">
                {String(c.userId ?? "").slice(0, 8)}
              </td>
              <td className="p-2">
                ₦{Number(c.requestedAmount ?? 0).toLocaleString()}
              </td>
              <td className="p-2 text-[var(--om-text-muted)]">
                ₦{c.feeAmount}
              </td>
              <td className="p-2">
                ₦{Number(c.netAmount ?? 0).toLocaleString()}
              </td>
              <td className="p-2">
                <span
                  className={badge(
                    c.status === "paid"
                      ? "bg-green-50 text-green-700"
                      : c.status === "pending"
                        ? "bg-yellow-50 text-yellow-700"
                        : c.status === "rejected" || c.status === "failed"
                          ? "bg-red-50 text-red-700"
                          : c.status === "processing"
                            ? "bg-orange-50 text-orange-700"
                            : "bg-blue-50 text-blue-700",
                  )}
                >
                  {c.status}
                  {c.status === "processing" && c.retryCount
                    ? ` (try ${c.retryCount})`
                    : ""}
                </span>
              </td>
              <td className="p-2">
                <div className="flex gap-1">
                  {c.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onAction("approve-cashout", { id: c.id })
                        }
                        className="rounded bg-green-500 px-2 py-1 text-[10px] font-bold text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAction("reject-cashout", {
                            id: c.id,
                            reason: "Rejected",
                          })
                        }
                        className="rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white"
                      >
                        Reject
                      </button>
                    </>
                  ) : c.status === "approved" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          onAction("transfer-cashout", { id: c.id })
                        }
                        className="rounded bg-blue-500 px-2 py-1 text-[10px] font-bold text-white"
                        title="Start the automatic Flutterwave bank transfer"
                      >
                        Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => onAction("pay-cashout", { id: c.id })}
                        className="rounded bg-[#323231] px-2 py-1 text-[10px] font-bold text-white"
                        title="Mark as paid manually (you paid outside Ona). Needs access code."
                      >
                        Mark Paid
                      </button>
                    </>
                  ) : c.status === "processing" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onAction("retry-cashout", { id: c.id })}
                        className="rounded bg-blue-500 px-2 py-1 text-[10px] font-bold text-white"
                        title="Retry the transfer now"
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAction("force-fail-cashout", {
                            id: c.id,
                            reason: "Force-failed from cashouts board",
                          })
                        }
                        className="rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white"
                        title="Return funds to the user's wallet and close this request. Needs access code."
                      >
                        Force fail
                      </button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {cashoutList.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="p-4 text-center text-[var(--om-text-muted)]"
              >
                No cashout requests
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
