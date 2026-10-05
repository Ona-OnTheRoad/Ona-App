import type { DispatchJob } from "./types";

export function JobControlsCell({
  j,
  busyId,
  proValue,
  availablePros,
  onAction,
  onProChange,
}: {
  j: DispatchJob;
  busyId: string | null;
  proValue: string;
  availablePros: { id: string; name: string }[];
  onAction: (action: string, job: DispatchJob) => void;
  onProChange: (jobId: string, proId: string) => void;
}) {
  return (
    <td>
      <div
        className="om-admin-row-actions"
        style={{
          flexDirection: "column",
          alignItems: "stretch",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            className="om-admin-btn"
            disabled={busyId === j.id}
            onClick={() => onAction("reroute", j)}
          >
            {busyId === j.id ? "…" : "Reroute"}
          </button>
          <button
            type="button"
            className="om-admin-btn"
            disabled={busyId === j.id}
            onClick={() => onAction("clear_cooldowns", j)}
          >
            Clear cooldowns
          </button>
          <button
            type="button"
            className="om-admin-btn"
            style={{ background: "#dc2626", color: "#fff" }}
            disabled={busyId === j.id}
            onClick={() => onAction("expire", j)}
          >
            Expire
          </button>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <select
            value={proValue}
            onChange={(e) => onProChange(j.id, e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          >
            <option value="">Choose pro…</option>
            {availablePros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="om-admin-btn"
            disabled={busyId === j.id}
            onClick={() => onAction("reassign", j)}
          >
            Assign
          </button>
        </div>
      </div>
    </td>
  );
}
