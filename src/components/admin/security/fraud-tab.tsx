import { badge } from "./types";
import type { AdminRow, OnAction } from "./types";

export function FraudTab({
  flags,
  onAction,
}: {
  flags: AdminRow[];
  onAction: OnAction;
}) {
  return (
    <div className="space-y-3">
      <table className="w-full text-left text-[12px]">
        <thead>
          <tr className="border-b border-[var(--om-border)] text-[11px] font-semibold text-[var(--om-text-muted)]">
            <th className="p-2">User</th>
            <th className="p-2">Type</th>
            <th className="p-2">Risk</th>
            <th className="p-2">Description</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((f) => (
            <tr
              key={String(f.id)}
              className="border-b border-[var(--om-border-soft)]"
            >
              <td className="p-2 font-medium">
                {String(f.userId ?? "").slice(0, 8)}
              </td>
              <td className="p-2 capitalize">
                {String(f.flagType ?? "").replace("_", " ")}
              </td>
              <td className="p-2">
                <span
                  className={badge(
                    f.riskLevel === "critical"
                      ? "bg-red-50 text-red-700"
                      : f.riskLevel === "high"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-yellow-50 text-yellow-700",
                  )}
                >
                  {f.riskLevel}
                </span>
              </td>
              <td className="p-2 text-[var(--om-text-muted)]">
                {f.description}
              </td>
              <td className="p-2">{f.status}</td>
              <td className="p-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onAction("resolve-fraud", { id: f.id })}
                    className="rounded bg-green-500 px-2 py-1 text-[10px] font-bold text-white"
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction("block-fraud", { id: f.id })}
                    className="rounded bg-red-500 px-2 py-1 text-[10px] font-bold text-white"
                  >
                    Block
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {flags.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="p-4 text-center text-[var(--om-text-muted)]"
              >
                No fraud flags
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
