import { badge } from "./types";
import type { AdminRow, FetchSection, OnAction } from "./types";

export function ContactChangesTab({
  requests,
  fetchSection,
  onAction,
}: {
  requests: AdminRow[];
  fetchSection: FetchSection;
  onAction: OnAction;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["all", "pending", "approved", "rejected", "under_review"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void fetchSection("contact-changes", `status=${s}`)}
            className="rounded-lg border border-[var(--om-border)] bg-[var(--om-bg-elevated)] px-3 py-1.5 text-[11px] font-semibold text-[var(--om-text)] hover:bg-[var(--om-nav-hover)]"
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-[var(--om-border)] text-[11px] font-semibold text-[var(--om-text-muted)]">
              <th className="p-2">User</th>
              <th className="p-2">Type</th>
              <th className="p-2">Old</th>
              <th className="p-2">New</th>
              <th className="p-2">Status</th>
              <th className="p-2">Risk</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr
                key={String(r.id)}
                className="border-b border-[var(--om-border-soft)]"
              >
                <td className="p-2 font-medium">
                  {String(r.userId ?? "").slice(0, 8)}
                </td>
                <td className="p-2">{r.changeType}</td>
                <td className="p-2 text-[var(--om-text-muted)]">
                  {r.oldValue}
                </td>
                <td className="p-2 text-[var(--om-text-muted)]">
                  {r.newValue}
                </td>
                <td className="p-2">
                  <span
                    className={badge(
                      r.status === "approved"
                        ? "bg-green-50 text-green-700"
                        : r.status === "rejected"
                          ? "bg-red-50 text-red-700"
                          : r.status === "under_review"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-blue-50 text-blue-700",
                    )}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-2">{r.riskScore}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onAction("approve-contact-change", {
                          id: r.id,
                          reason: "Admin approved",
                        })
                      }
                      className="rounded bg-green-500 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAction("reject-contact-change", {
                          id: r.id,
                          reason: "Admin rejected",
                        })
                      }
                      className="rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onAction("hold-contact-change", {
                          id: r.id,
                          reason: "Under review",
                        })
                      }
                      className="rounded bg-yellow-500 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Hold
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-4 text-center text-[var(--om-text-muted)]"
                >
                  No requests
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
