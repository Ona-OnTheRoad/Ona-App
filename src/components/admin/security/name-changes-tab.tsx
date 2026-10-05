import { badge } from "./types";
import type { AdminRow, FetchSection, OnAction } from "./types";

export function NameChangesTab({
  nameRequests,
  fetchSection,
  onAction,
}: {
  nameRequests: AdminRow[];
  fetchSection: FetchSection;
  onAction: OnAction;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["all", "pending", "under_review", "approved", "rejected"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void fetchSection("name-changes", `status=${s}`)}
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
              <th className="p-2">User ID</th>
              <th className="p-2">Current Name</th>
              <th className="p-2">Requested Name</th>
              <th className="p-2">Reason</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {nameRequests.map((r) => (
              <tr
                key={String(r.id)}
                className="border-b border-[var(--om-border-soft)]"
              >
                <td className="p-2 font-medium">
                  {String(r.userId ?? "").slice(0, 8)}
                </td>
                <td className="p-2">{r.currentName}</td>
                <td className="p-2 font-semibold">{r.requestedName}</td>
                <td className="p-2 text-[var(--om-text-muted)] max-w-[200px] truncate">
                  {r.reason || ""}
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
                <td className="p-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onAction("approve-name-change", {
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
                        onAction("reject-name-change", {
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
                        onAction("review-name-change", {
                          id: r.id,
                          reason: "Under review",
                        })
                      }
                      className="rounded bg-yellow-500 px-2 py-1 text-[10px] font-bold text-white"
                    >
                      Review
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {nameRequests.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-[var(--om-text-muted)]"
                >
                  No name change requests
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
