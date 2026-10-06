import type { Summary } from "./types";

export function DispatchStatCards({ summary }: { summary: Summary | null }) {
  return (
    <div className="om-admin-stat-grid">
      <div className="om-admin-stat-card" data-tone="held">
        <div className="om-admin-stat-label">Searching</div>
        <div className="om-admin-stat-value">{summary?.searching ?? ""}</div>
        <div className="om-admin-stat-sub">awaiting a pro</div>
      </div>
      <div className="om-admin-stat-card" data-tone="pending">
        <div className="om-admin-stat-label">Pairing</div>
        <div className="om-admin-stat-value">{summary?.pairing ?? ""}</div>
        <div className="om-admin-stat-sub">66s dispatch</div>
      </div>
      <div className="om-admin-stat-card" data-tone="pending">
        <div className="om-admin-stat-label">Negotiating</div>
        <div className="om-admin-stat-value">{summary?.negotiating ?? ""}</div>
        <div className="om-admin-stat-sub">pro has the request</div>
      </div>
      <div className="om-admin-stat-card" data-tone="available">
        <div className="om-admin-stat-label">Agreed</div>
        <div className="om-admin-stat-value">{summary?.agreed ?? ""}</div>
        <div className="om-admin-stat-sub">price agreed</div>
      </div>
      <div className="om-admin-stat-card" data-tone="ledger">
        <div className="om-admin-stat-label">Deferred</div>
        <div className="om-admin-stat-value">
          {summary?.activeDeferrals ?? ""}
        </div>
        <div className="om-admin-stat-sub">pro “Later” (5 min)</div>
      </div>
      <div className="om-admin-stat-card" data-tone="failed">
        <div className="om-admin-stat-label">Excluded</div>
        <div className="om-admin-stat-value">
          {(summary?.activeExclusions ?? 0) +
            (summary?.crossJobExclusions ?? 0)}
        </div>
        <div className="om-admin-stat-sub">
          declined (per-request) · {summary?.crossJobExclusions ?? 0} cross-job
        </div>
      </div>
    </div>
  );
}
