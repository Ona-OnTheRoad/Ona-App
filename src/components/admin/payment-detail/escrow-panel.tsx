import type { FlwTransfer, PaymentDetailData } from "./types";

export function EscrowPanel({
  data,
  p,
  meta,
  successFlw,
}: {
  data: PaymentDetailData | null;
  p: Record<string, unknown>;
  meta: Record<string, unknown>;
  successFlw: FlwTransfer[];
}) {
  return (
    <div className="om-admin-panel" style={{ marginBottom: 16 }}>
      <h2 className="om-admin-h2" style={{ marginTop: 0 }}>
        Escrow & status
      </h2>
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "160px 1fr",
          gap: "6px 12px",
          fontSize: 13,
          margin: 0,
        }}
      >
        <dt className="om-admin-muted">Payment id</dt>
        <dd style={{ margin: 0, wordBreak: "break-all" }}>{String(p.id)}</dd>
        <dt className="om-admin-muted">Job / request</dt>
        <dd style={{ margin: 0, wordBreak: "break-all" }}>
          {String(p.request_id || "")}
          {data?.job ? (
            <span className="om-admin-muted">
              {" "}
              · job {String(data.job.flow_status || data.job.status)} · escrow{" "}
              {String(data.job.escrow_status || "")}
            </span>
          ) : null}
        </dd>
        <dt className="om-admin-muted">Escrow status</dt>
        <dd style={{ margin: 0 }}>
          <span className="om-admin-badge">{String(p.escrow_status)}</span> ·{" "}
          {String(p.status)}
          {meta.payoutStatus ? (
            <span className="om-admin-muted">
              {" "}
              · payout {String(meta.payoutStatus)}
            </span>
          ) : null}
        </dd>
        <dt className="om-admin-muted">Collection ref</dt>
        <dd style={{ margin: 0, wordBreak: "break-all" }}>
          {String(p.provider_ref || "")}
        </dd>
        <dt className="om-admin-muted">Payout ref (idempotent)</dt>
        <dd style={{ margin: 0, wordBreak: "break-all" }}>
          {String(p.idempotent_transfer_ref || "")}
        </dd>
        <dt className="om-admin-muted">FLW transfer</dt>
        <dd style={{ margin: 0 }}>
          {data?.flwLookup?.found
            ? `Found · ${data.flwLookup.status || ""} · ${data.flwLookup.reference || ""}`
            : successFlw.length
              ? `${successFlw.length} SUCCESS row(s) on FLW`
              : "No successful transfer found for this ref"}
        </dd>
        <dt className="om-admin-muted">Last error</dt>
        <dd style={{ margin: 0, color: "#b91c1c", fontSize: 12 }}>
          {meta.lastReleaseError ? String(meta.lastReleaseError) : ""}
        </dd>
        <dt className="om-admin-muted">Retries</dt>
        <dd style={{ margin: 0 }}>
          {meta.payoutRetryCount != null ? String(meta.payoutRetryCount) : ""}
          {meta.nextRetryAt
            ? ` · next ${new Date(String(meta.nextRetryAt)).toLocaleString()}`
            : ""}
        </dd>
      </dl>
    </div>
  );
}
