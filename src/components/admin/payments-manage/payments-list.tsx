import { effectiveOf, naira } from "./helpers";
import { styles } from "./styles";
import { FILTERS, type FilterKey, type Payment } from "./types";

type Props = {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  filter: FilterKey;
  setFilter: (k: FilterKey) => void;
  counts: Record<string, number>;
  filtered: Payment[];
  payments: Payment[];
  loading: boolean;
};

export function PaymentsList({
  selectedId,
  setSelectedId,
  filter,
  setFilter,
  counts,
  filtered,
  payments,
  loading,
}: Props) {
  return (
    <div
      style={{
        flex: selectedId ? "0 0 50%" : 1,
        minWidth: selectedId ? 400 : 0,
      }}
    >
      <div style={styles.panel}>
        <div style={{ ...styles.flex, marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, flex: 1 }}>
            Payments
          </h2>
          {FILTERS.map(({ key, label }) => {
            const n = counts[key] ?? 0;
            const active = filter === key;
            return (
              <button
                key={key}
                style={{
                  ...styles.link,
                  fontWeight: active ? 700 : 400,
                  textDecoration: active ? "underline" : "none",
                  opacity: key !== "all" && n === 0 ? 0.5 : 1,
                }}
                onClick={() => setFilter(key)}
              >
                {label} ({n})
              </button>
            );
          })}
        </div>
        {loading && payments.length === 0 ? (
          <p style={styles.muted}>Loading payments...</p>
        ) : filtered.length === 0 ? (
          <p style={styles.muted}>
            No payments in <strong>{filter}</strong>.
          </p>
        ) : (
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>When</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const e = effectiveOf(p);
                  return (
                    <tr
                      key={p.id}
                      style={{
                        background: selectedId === p.id ? "#eff6ff" : undefined,
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setSelectedId(selectedId === p.id ? null : p.id)
                      }
                    >
                      <td style={styles.td}>
                        <strong>{naira(p.amount_kobo)}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badge(e)}>
                          {p.display_status || e}
                        </span>
                      </td>
                      <td style={{ ...styles.td, ...styles.muted }}>
                        {p.provider_ref
                          ? String(p.provider_ref).slice(0, 16)
                          : ""}
                      </td>
                      <td
                        style={{
                          ...styles.td,
                          ...styles.muted,
                          fontSize: 11,
                        }}
                      >
                        {p.paid_at
                          ? new Date(p.paid_at).toLocaleDateString()
                          : new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.link}>
                          {selectedId === p.id ? "▼ close" : "▶ select"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
