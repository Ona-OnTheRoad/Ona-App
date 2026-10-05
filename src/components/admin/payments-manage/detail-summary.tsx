import { styles } from "./styles";
import type { Detail } from "./types";

export function DetailSummary({
  detail,
  esc,
  meta,
}: {
  detail: Detail;
  esc: string;
  meta: Record<string, unknown>;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px 16px",
        fontSize: 12,
        marginBottom: 12,
        background: "#f9fafb",
        padding: 12,
        borderRadius: 6,
      }}
    >
      <span style={styles.muted}>Status</span>
      <span>
        <span style={styles.badge(esc)}>{esc}</span> ·{" "}
        {String(detail.payment.status)}
      </span>
      <span style={styles.muted}>Payment ID</span>
      <span style={{ wordBreak: "break-all" }}>
        {String(detail.payment.id)}
      </span>
      <span style={styles.muted}>Job / request</span>
      <span style={{ wordBreak: "break-all" }}>
        {String(detail.payment.request_id || "")}
      </span>
      <span style={styles.muted}>FLW transfer</span>
      <span>
        {detail.flwLookup?.found
          ? `Found · ${detail.flwLookup.status || ""}`
          : detail.flwTransfers.filter((t) =>
                /success/i.test(String(t.status || "")),
              ).length
            ? "Found on FLW"
            : "No successful transfer"}
      </span>
      <span style={styles.muted}>Last error</span>
      <span style={{ color: "#b91c1c" }}>
        {String(meta.lastReleaseError || "")}
      </span>
      <span style={styles.muted}>Retries</span>
      <span>
        {meta.payoutRetryCount != null ? String(meta.payoutRetryCount) : ""}
        {meta.nextRetryAt
          ? ` · next ${new Date(String(meta.nextRetryAt)).toLocaleString()}`
          : ""}
      </span>
      {detail.doublePayRisk ? (
        <span
          style={{
            color: "#b91c1c",
            gridColumn: "1 / -1",
            fontWeight: 600,
          }}
        >
          {detail.doublePayRisk}
        </span>
      ) : null}
    </div>
  );
}
