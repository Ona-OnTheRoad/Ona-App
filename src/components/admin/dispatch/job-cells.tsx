import { fmtClock, fmtLeft } from "./format";
import { StatusBadge } from "./status-badge";
import type { DispatchJob } from "./types";

export function JobStatusCell({ j }: { j: DispatchJob }) {
  return (
    <td>
      <StatusBadge status={j.flowStatus} />
      {j.pairingStage ? (
        <div
          className="om-admin-muted"
          style={{
            marginTop: 4,
            fontSize: 10,
            lineHeight: 1.5,
          }}
        >
          stage {j.pairingStage}
          {j.queuePosition ? ` · pos ${j.queuePosition}` : ""}
          {j.remainingCandidates != null
            ? ` · ${j.remainingCandidates} left`
            : ""}
          {j.pairingRadiusKm ? ` · ${j.pairingRadiusKm}km` : ""}
        </div>
      ) : null}
      {j.pairingDeadline ? (
        <div className="om-admin-muted" style={{ marginTop: 2, fontSize: 10 }}>
          pairs in {fmtLeft(j.pairingDeadline)}
        </div>
      ) : null}
      {j.meritScore != null ? (
        <div className="om-admin-muted" style={{ marginTop: 2, fontSize: 10 }}>
          merit {j.meritScore.toFixed(1)}
        </div>
      ) : null}
      {j.reservationStatus === "confirmed" ? (
        <div className="om-admin-muted" style={{ marginTop: 2, fontSize: 10 }}>
          confirmed assignment
        </div>
      ) : null}
      {j.searchEndsAt ? (
        <div className="om-admin-muted" style={{ marginTop: 4, fontSize: 10 }}>
          search ends {fmtLeft(j.searchEndsAt)}
        </div>
      ) : null}
      {j.negotiateEndsAt ? (
        <div className="om-admin-muted" style={{ marginTop: 2, fontSize: 10 }}>
          negotiate ends {fmtLeft(j.negotiateEndsAt)}
        </div>
      ) : null}
    </td>
  );
}

export function JobCooldownCell({ j }: { j: DispatchJob }) {
  return (
    <td>
      {j.activeDeferrals.map((d) => (
        <div key={`d-${d.proId}`} style={{ fontSize: 11, color: "#b45309" }}>
          Deferred · {d.proName} until {fmtClock(d.until || "")} (
          {fmtLeft(d.until || "")})
        </div>
      ))}
      {j.activeExclusions.map((e) => (
        <div key={`e-${e.proId}`} style={{ fontSize: 11, color: "#b91c1c" }}>
          Excluded · {e.proName}{" "}
          {e.until
            ? `until ${fmtClock(e.until)} (${fmtLeft(e.until)})`
            : "per-request"}
        </div>
      ))}
      {j.chosenProName ? (
        <div style={{ fontSize: 11, color: "#6d28d9" }}>
          Chosen: {j.chosenProName}
        </div>
      ) : null}
      {j.activeDeferrals.length === 0 &&
      j.activeExclusions.length === 0 &&
      !j.chosenProName ? (
        <span className="om-admin-muted"></span>
      ) : null}
      <div
        className="om-admin-muted"
        style={{ marginTop: 4, fontSize: 10, lineHeight: 1.5 }}
      >
        {j.historySummary.length ? j.historySummary.join(" · ") : "no events"}
      </div>
    </td>
  );
}
