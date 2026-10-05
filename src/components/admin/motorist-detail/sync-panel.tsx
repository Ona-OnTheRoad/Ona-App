import type { Detail } from "./types";

export function SyncPanel({
  data,
  busy,
  onReSync,
}: {
  data: Detail;
  busy: boolean;
  onReSync: () => void;
}) {
  return (
    <div className="om-admin-panel" style={{ marginBottom: 16 }}>
      <div className="om-admin-toolbar">
        <strong>Accounts & identity sync</strong>
        <div className="om-admin-row-actions" style={{ marginLeft: "auto" }}>
          <button
            type="button"
            className="om-admin-btn"
            disabled={busy}
            onClick={() => onReSync()}
          >
            Re-run sync
          </button>
        </div>
      </div>
      <table className="om-admin-table">
        <tbody>
          <tr>
            <th style={{ width: 160 }}>Attached roles</th>
            <td>
              {data.identity?.roles.length ? (
                <span>
                  {data.identity.roles.includes("motorist") ? "Customer" : ""}
                  {data.identity.roles.includes("motorist") &&
                  data.identity.roles.includes("repair_pro")
                    ? " + "
                    : ""}
                  {data.identity.roles.includes("repair_pro")
                    ? "Repair Pro"
                    : ""}
                </span>
              ) : (
                <span className="om-admin-muted"></span>
              )}
            </td>
          </tr>
          <tr>
            <th>Sync status</th>
            <td>
              <span className="om-admin-badge pending">
                {data.identity?.syncStatus || "unknown"}
              </span>
            </td>
          </tr>
          <tr>
            <th>Payout method</th>
            <td>
              {data.identity?.payoutMethod ? (
                <span>
                  {String(data.identity.payoutMethod.bank_name || "Bank")} · …
                  {String(
                    data.identity.payoutMethod.account_number_last4 || "????",
                  )}{" "}
                  <span className="om-admin-muted">
                    ({String(data.identity.payoutMethod.linked_role || "")})
                  </span>
                </span>
              ) : (
                <span className="om-admin-muted"></span>
              )}
            </td>
          </tr>
          <tr>
            <th>Completed fields</th>
            <td>
              {data.identity?.completedFields?.length ? (
                <span className="om-admin-muted">
                  {data.identity.completedFields.join(", ")}
                </span>
              ) : (
                <span className="om-admin-muted"></span>
              )}
            </td>
          </tr>
          <tr>
            <th>Missing fields</th>
            <td>
              {data.identity?.missingFields?.length ? (
                <span style={{ color: "#b45309" }}>
                  {data.identity.missingFields.join(", ")}
                </span>
              ) : (
                <span className="om-admin-muted"></span>
              )}
            </td>
          </tr>
          <tr>
            <th>Recent sync events</th>
            <td>
              {data.identity?.syncLog?.length ? (
                data.identity.syncLog.slice(0, 4).map((e) => (
                  <div
                    key={e.id}
                    className="om-admin-muted"
                    style={{ fontSize: 11, lineHeight: 1.5 }}
                  >
                    {e.action} · {e.result}
                    {e.error ? ` · ${e.error}` : ""}{" "}
                    {new Date(e.created_at).toLocaleString()}
                  </div>
                ))
              ) : (
                <span className="om-admin-muted"></span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
