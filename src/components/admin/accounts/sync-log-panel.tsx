import { fmt, type Board } from "./types";

export function SyncLogPanel({ data }: { data: Board | null }) {
  return (
    <div className="om-admin-panel" style={{ marginTop: 14 }}>
      <div className="om-admin-toolbar">
        <strong>Recent identity sync events</strong>
      </div>
      <div className="om-admin-table-scroll">
        <table className="om-admin-table">
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Action</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {!data || data.syncLog.length === 0 ? (
              <tr>
                <td colSpan={4} className="om-admin-muted">
                  No sync events yet.
                </td>
              </tr>
            ) : (
              data.syncLog.map((e) => (
                <tr key={e.id}>
                  <td className="om-admin-muted">{fmt(e.created_at)}</td>
                  <td>
                    {e.user_id ? (
                      <a
                        href={`/admin/motorists/${e.user_id}`}
                        className="om-admin-muted"
                      >
                        {e.user_id.slice(0, 8)}…
                      </a>
                    ) : (
                      ""
                    )}
                  </td>
                  <td>{e.action}</td>
                  <td>
                    <span
                      className={`om-admin-badge ${
                        e.result === "error" ? "failed" : ""
                      }`}
                    >
                      {e.result}
                    </span>
                    {e.error ? (
                      <div className="om-admin-muted" style={{ fontSize: 10 }}>
                        {e.error}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
