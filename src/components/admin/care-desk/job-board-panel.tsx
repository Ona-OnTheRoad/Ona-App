import Link from "next/link";
import type { Board } from "./types";

export function JobBoardPanel({
  board,
  selectedJobId,
  refreshBoard,
  openJob,
}: {
  board: Board | null;
  selectedJobId: string | null;
  refreshBoard: () => Promise<void>;
  openJob: (id: string) => Promise<void>;
}) {
  return (
    <div className="om-admin-panel">
      <div className="om-admin-toolbar">
        <strong>Live job board</strong>
        <button
          type="button"
          className="om-admin-btn ghost"
          onClick={() => void refreshBoard()}
        >
          Refresh
        </button>
      </div>
      <div style={{ maxHeight: 420, overflow: "auto" }}>
        {(board?.jobs ?? []).length === 0 ? (
          <p className="om-admin-muted">No active jobs</p>
        ) : (
          <table className="om-admin-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Parties</th>
                <th>₦</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(board?.jobs ?? []).map((j) => (
                <tr
                  key={j.id}
                  style={
                    selectedJobId === j.id
                      ? { background: "var(--om-accent-soft)" }
                      : undefined
                  }
                >
                  <td>
                    <code>{j.flow_status || j.status}</code>
                    {j.escrow_status ? (
                      <>
                        <br />
                        <span
                          className="om-admin-muted"
                          style={{ fontSize: 11 }}
                        >
                          escrow:{j.escrow_status}
                        </span>
                      </>
                    ) : null}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {j.motorist_name || ""}
                    <br />
                    <span className="om-admin-muted">
                      {j.repair_pro_name || ""}
                    </span>
                  </td>
                  <td>
                    {j.agreed_major != null
                      ? Number(j.agreed_major).toLocaleString()
                      : ""}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="om-admin-btn primary"
                      onClick={() => void openJob(j.id)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p style={{ marginTop: "0.75rem" }}>
        <Link href="/admin/jobs">Full jobs list →</Link>
        {" · "}
        <Link href="/admin/disputes">Disputes →</Link>
      </p>
    </div>
  );
}
