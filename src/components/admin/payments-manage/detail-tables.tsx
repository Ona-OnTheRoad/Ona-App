import { naira } from "./helpers";
import { styles } from "./styles";
import type { Detail } from "./types";

export function DetailTables({ detail }: { detail: Detail }) {
  return (
    <>
      <div style={{ marginTop: 16 }}>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 600,
            margin: "0 0 8px",
          }}
        >
          Transfer ledger
        </h3>
        {!detail.ledger?.length ? (
          <p style={styles.muted}>No ledger rows.</p>
        ) : (
          <table style={{ ...styles.table, fontSize: 12 }}>
            <thead>
              <tr>
                <th style={styles.th}>Ref</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>When</th>
              </tr>
            </thead>
            <tbody>
              {detail.ledger.map((r) => (
                <tr key={r.id}>
                  <td
                    style={{
                      ...styles.td,
                      wordBreak: "break-all",
                      maxWidth: 120,
                    }}
                  >
                    {r.transferRef}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge(r.status)}>{r.status}</span>
                  </td>
                  <td style={styles.td}>{naira(r.amountMinor)}</td>
                  <td
                    style={{
                      ...styles.td,
                      ...styles.muted,
                      fontSize: 11,
                    }}
                  >
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <h3
          style={{
            fontSize: 13,
            fontWeight: 600,
            margin: "0 0 8px",
          }}
        >
          FLW transfers
        </h3>
        {!detail.flwTransfers?.length ? (
          <p style={styles.muted}>No FLW transfers matched.</p>
        ) : (
          <table style={{ ...styles.table, fontSize: 12 }}>
            <thead>
              <tr>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Account</th>
                <th style={styles.th}>When</th>
              </tr>
            </thead>
            <tbody>
              {detail.flwTransfers.map((t, i) => (
                <tr key={String(t.id || t.reference || i)}>
                  <td style={styles.td}>
                    <span
                      style={styles.badge(String(t.status || "").toLowerCase())}
                    >
                      {t.status || ""}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {t.amount != null
                      ? `₦${Number(t.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                      : ""}
                  </td>
                  <td style={{ ...styles.td, fontSize: 11 }}>
                    {t.bank_name || ""} {t.account_number || ""}
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      ...styles.muted,
                      fontSize: 11,
                    }}
                  >
                    {t.created_at
                      ? new Date(t.created_at).toLocaleString()
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
