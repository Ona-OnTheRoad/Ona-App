import { naira } from "./helpers";
import { styles } from "./styles";
import type { Detail } from "./types";

export function DetailParties({ detail }: { detail: Detail }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 12,
        fontSize: 13,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            margin: "0 0 4px",
          }}
        >
          Customer (payer)
        </p>
        <p style={{ margin: 0, fontWeight: 700 }}>
          {detail.parties?.customer?.name || ""}
        </p>
        <p style={styles.muted}>
          {detail.parties?.customer?.phone || ""}
          {detail.parties?.customer?.email
            ? ` · ${detail.parties.customer.email}`
            : ""}
        </p>
        <p style={{ fontSize: 12, marginTop: 6 }}>
          Paid <strong>{naira(Number(detail.payment.amount_kobo) || 0)}</strong>
        </p>
      </div>
      <div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            margin: "0 0 4px",
          }}
        >
          Repair Pro (payee)
        </p>
        <p style={{ margin: 0, fontWeight: 700 }}>
          {detail.parties?.pro?.name || ""}
        </p>
        <p style={styles.muted}>
          {detail.parties?.pro?.bank?.bankName || ""} ·{" "}
          {detail.parties?.pro?.bank?.accountName || ""} · ****
          {detail.parties?.pro?.bank?.accountLast4 || "????"}
        </p>
        <p style={{ fontSize: 12, marginTop: 6 }}>
          Pro share{" "}
          <strong>
            {detail.payment.pro_payout_kobo != null
              ? naira(Number(detail.payment.pro_payout_kobo))
              : ""}
          </strong>
        </p>
      </div>
    </div>
  );
}
