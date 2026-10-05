import { nairaFromKobo } from "./format";
import type { PaymentDetailData } from "./types";

export function PartiesPanel({
  data,
  p,
}: {
  data: PaymentDetailData | null;
  p: Record<string, unknown>;
}) {
  return (
    <div
      className="om-admin-panel"
      style={{
        marginBottom: 16,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
    >
      <div>
        <h2 className="om-admin-h2" style={{ marginTop: 0 }}>
          Customer (payer)
        </h2>
        <p style={{ margin: "4px 0", fontWeight: 700 }}>
          {data?.parties?.customer?.name || ""}
        </p>
        <p className="om-admin-muted" style={{ fontSize: 12, margin: 0 }}>
          {data?.parties?.customer?.phone || ""}
          {data?.parties?.customer?.email
            ? ` · ${data.parties.customer.email}`
            : ""}
        </p>
        <p className="om-admin-muted" style={{ fontSize: 11, marginTop: 6 }}>
          Paid <strong>{nairaFromKobo(Number(p.amount_kobo) || 0)}</strong>
          {p.paid_at
            ? ` · ${new Date(String(p.paid_at)).toLocaleString()}`
            : ""}
        </p>
      </div>
      <div>
        <h2 className="om-admin-h2" style={{ marginTop: 0 }}>
          Repair Pro (payee)
        </h2>
        <p style={{ margin: "4px 0", fontWeight: 700 }}>
          {data?.parties?.pro?.name || ""}
        </p>
        <p className="om-admin-muted" style={{ fontSize: 12, margin: 0 }}>
          {data?.parties?.pro?.bank?.bankName ||
            data?.parties?.pro?.bank?.bankCode ||
            ""}{" "}
          · {data?.parties?.pro?.bank?.accountName || ""} · ****
          {data?.parties?.pro?.bank?.accountLast4 || "????"}
        </p>
        <p className="om-admin-muted" style={{ fontSize: 11, marginTop: 6 }}>
          Pro share{" "}
          <strong>
            {p.pro_payout_kobo != null
              ? nairaFromKobo(Number(p.pro_payout_kobo))
              : ""}
          </strong>
          {p.platform_fee_kobo != null
            ? ` · Ona ${nairaFromKobo(Number(p.platform_fee_kobo))}`
            : ""}
        </p>
      </div>
    </div>
  );
}
