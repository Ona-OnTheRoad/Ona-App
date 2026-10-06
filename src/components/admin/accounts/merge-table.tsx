import type { Dispatch, SetStateAction } from "react";
import {
  SIGNAL_LABELS,
  fmt,
  matchReasonLabel,
  type Board,
  type MergeCandidate,
} from "./types";

export function MergePanel({
  data,
  primaryOverride,
  setPrimaryOverride,
  busyMerge,
  onScan,
  onDecide,
}: {
  data: Board | null;
  primaryOverride: Record<string, "primary" | "duplicate">;
  setPrimaryOverride: Dispatch<
    SetStateAction<Record<string, "primary" | "duplicate">>
  >;
  busyMerge: string | null;
  onScan: () => void;
  onDecide: (candidate: MergeCandidate, action: "merge" | "reject") => void;
}) {
  return (
    <div className="om-admin-panel" style={{ marginTop: 14 }}>
      <div className="om-admin-toolbar">
        <strong>
          Duplicate identities{" "}
          <span className="om-admin-muted">· review before merge</span>
        </strong>
        <button type="button" className="om-admin-btn" onClick={() => onScan()}>
          Scan for duplicates
        </button>
      </div>
      <div className="om-admin-table-scroll">
        <table className="om-admin-table">
          <thead>
            <tr>
              <th>Primary identity (keeps)</th>
              <th>Duplicate (merged in)</th>
              <th>Why matched</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!data || data.merges.length === 0 ? (
              <tr>
                <td colSpan={4} className="om-admin-muted">
                  No pending merge candidates. Run a scan to find duplicate
                  identities (matched by NIN/BVN last-4 across Customer and
                  Repair Pro accounts).
                </td>
              </tr>
            ) : (
              data.merges.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{m.primary_name}</div>
                    <div className="om-admin-muted">
                      {m.primary_email || ""}
                    </div>
                    <div className="om-admin-muted" style={{ fontSize: 10 }}>
                      {m.primary_user_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td>
                    <div>{m.duplicate_name}</div>
                    <div className="om-admin-muted">
                      {m.duplicate_email || ""}
                    </div>
                    <div className="om-admin-muted" style={{ fontSize: 10 }}>
                      {m.duplicate_user_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td>
                    <div>{matchReasonLabel(m.match_reason)}</div>
                    <div className="om-admin-muted" style={{ fontSize: 10 }}>
                      {m.match_detail?.matched_signal
                        ? `${SIGNAL_LABELS[String(m.match_detail.matched_signal)] || m.match_detail.matched_signal} · ${String(m.match_detail.matched_value || "")}`
                        : ""}
                    </div>
                    <div className="om-admin-muted" style={{ fontSize: 10 }}>
                      queued {fmt(m.created_at)}
                    </div>
                  </td>
                  <td>
                    <div
                      className="om-admin-row-actions"
                      style={{
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: 4,
                      }}
                    >
                      <select
                        value={primaryOverride[m.id] || "primary"}
                        onChange={(e) =>
                          setPrimaryOverride((s) => ({
                            ...s,
                            [m.id]: e.target.value as "primary" | "duplicate",
                          }))
                        }
                      >
                        <option value="primary">Primary keeps identity</option>
                        <option value="duplicate">
                          Make the duplicate the primary
                        </option>
                      </select>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          className="om-admin-btn"
                          disabled={busyMerge === m.id}
                          onClick={() => onDecide(m, "merge")}
                        >
                          {busyMerge === m.id ? "…" : "Approve merge"}
                        </button>
                        <button
                          type="button"
                          className="om-admin-btn ghost"
                          disabled={busyMerge === m.id}
                          onClick={() => onDecide(m, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
