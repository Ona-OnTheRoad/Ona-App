import { badge } from "./types";
import type { AdminRow, FetchSection } from "./types";

export function AuditTab({
  actions,
  fetchSection,
}: {
  actions: AdminRow[];
  fetchSection: FetchSection;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => void fetchSection("audit")}
          className="rounded-lg border border-[var(--om-border)] bg-[var(--om-bg-elevated)] px-3 py-1.5 text-[11px] font-semibold"
        >
          All
        </button>
        <button
          type="button"
          onClick={() =>
            void fetchSection("audit", "actionType=approve-contact-change")
          }
          className="rounded-lg border border-[var(--om-border)] bg-[var(--om-bg-elevated)] px-3 py-1.5 text-[11px] font-semibold"
        >
          Contact
        </button>
        <button
          type="button"
          onClick={() =>
            void fetchSection("audit", "actionType=approve-referral")
          }
          className="rounded-lg border border-[var(--om-border)] bg-[var(--om-bg-elevated)] px-3 py-1.5 text-[11px] font-semibold"
        >
          Referral
        </button>
        <button
          type="button"
          onClick={() =>
            void fetchSection("audit", "actionType=approve-cashout")
          }
          className="rounded-lg border border-[var(--om-border)] bg-[var(--om-bg-elevated)] px-3 py-1.5 text-[11px] font-semibold"
        >
          Cashout
        </button>
      </div>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-[var(--om-panel)]">
            <tr className="border-b border-[var(--om-border)] font-semibold text-[var(--om-text-muted)]">
              <th className="p-2">Admin</th>
              <th className="p-2">Action</th>
              <th className="p-2">Target</th>
              <th className="p-2">Reason</th>
              <th className="p-2">Status</th>
              <th className="p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr
                key={String(a.id)}
                className="border-b border-[var(--om-border-soft)]"
              >
                <td className="p-2 font-medium">
                  {a.adminName || String(a.adminId ?? "").slice(0, 8)}
                </td>
                <td className="p-2">{a.actionType}</td>
                <td className="p-2 text-[var(--om-text-muted)]">
                  {a.targetType}:{String(a.targetId ?? "").slice(0, 8)}
                </td>
                <td className="p-2 text-[var(--om-text-muted)]">
                  {a.reason || ""}
                </td>
                <td className="p-2">
                  <span
                    className={badge(
                      a.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700",
                    )}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="p-2 text-[var(--om-text-muted)]">
                  {new Date(String(a.createdAt ?? "")).toLocaleString()}
                </td>
              </tr>
            ))}
            {actions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-4 text-center text-[var(--om-text-muted)]"
                >
                  No audit entries
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
