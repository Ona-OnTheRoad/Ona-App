import { nairaFromKobo } from "./format";
import type { PaymentDetailData } from "./types";

export function LedgerPanel({ data }: { data: PaymentDetailData | null }) {
  return (
    <div className="om-admin-panel" style={{ marginBottom: 16 }}>
      <h2 className="om-admin-h2" style={{ marginTop: 0 }}>
        Transfer ledger (unique ref)
      </h2>
      <table className="om-admin-table">
        <thead>
          <tr>
            <th>Ref</th>
            <th>Status</th>
            <th>Amount</th>
            <th>FLW id</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {!data?.ledger?.length ? (
            <tr>
              <td colSpan={5} className="om-admin-muted">
                No ledger rows yet.
              </td>
            </tr>
          ) : (
            data.ledger.map((r) => (
              <tr key={r.id}>
                <td style={{ wordBreak: "break-all", maxWidth: 180 }}>
                  {r.transferRef}
                </td>
                <td>
                  <span className="om-admin-badge">{r.status}</span>
                </td>
                <td>{nairaFromKobo(r.amountMinor)}</td>
                <td>{r.flwTransferId || ""}</td>
                <td className="om-admin-muted" style={{ fontSize: 12 }}>
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function FlwTransfersPanel({
  data,
}: {
  data: PaymentDetailData | null;
}) {
  return (
    <div className="om-admin-panel">
      <h2 className="om-admin-h2" style={{ marginTop: 0 }}>
        Flutterwave bank transfers
      </h2>
      <table className="om-admin-table">
        <thead>
          <tr>
            <th>FLW id</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Reference</th>
            <th>Bank / account</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {!data?.flwTransfers?.length ? (
            <tr>
              <td colSpan={6} className="om-admin-muted">
                No Flutterwave transfers matched.
              </td>
            </tr>
          ) : (
            data.flwTransfers.map((t, i) => (
              <tr key={String(t.id || t.reference || i)}>
                <td>{t.id || ""}</td>
                <td>
                  <span className="om-admin-badge">{t.status || ""}</span>
                </td>
                <td>
                  {t.amount != null
                    ? `₦${Number(t.amount).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}`
                    : ""}
                </td>
                <td style={{ wordBreak: "break-all", maxWidth: 160 }}>
                  {t.reference || ""}
                </td>
                <td style={{ fontSize: 12 }}>
                  {t.bank_name || ""} {t.account_number || ""}
                  <div className="om-admin-muted">
                    {t.narration || t.complete_message || ""}
                  </div>
                </td>
                <td className="om-admin-muted" style={{ fontSize: 12 }}>
                  {t.created_at ? new Date(t.created_at).toLocaleString() : ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
