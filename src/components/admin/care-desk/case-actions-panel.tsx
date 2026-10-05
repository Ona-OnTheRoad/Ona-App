import Link from "next/link";

export function CaseActionsPanel({
  jobDetail,
  job,
  flow,
  selectedJobId,
  busy,
  runAction,
}: {
  jobDetail: {
    job: Record<string, unknown>;
    escrow: Record<string, unknown> | null;
  } | null;
  job: Record<string, unknown> | undefined;
  flow: string;
  selectedJobId: string | null;
  busy: boolean;
  runAction: (body: Record<string, unknown>, reason: string) => Promise<void>;
}) {
  return (
    <div className="om-admin-panel">
      <strong>Case actions</strong>
      {!jobDetail ? (
        <p className="om-admin-muted" style={{ marginTop: "0.75rem" }}>
          Open a job from search or the live board.
        </p>
      ) : (
        <div style={{ marginTop: "0.75rem" }}>
          <p style={{ margin: "0 0 0.5rem" }}>
            <code>{String(job?.id || selectedJobId).slice(0, 13)}…</code>
            <br />
            Status: <strong>{String(job?.status || flow)}</strong>
            <br />
            Customer: {String(job?.motoristName || job?.motorist_name || "")}
            <br />
            Pro: {String(job?.repairProName || job?.repair_pro_name || "")}
            <br />
            Address: {String(job?.locationLabel || job?.pickup_address || "")}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginTop: "0.75rem",
            }}
          >
            <button
              type="button"
              className="om-admin-btn primary"
              disabled={busy}
              onClick={() =>
                void runAction(
                  { type: "release_escrow", jobId: selectedJobId },
                  "Enter password to release escrow to the Repair Pro.",
                )
              }
            >
              Release escrow
            </button>
            <button
              type="button"
              className="om-admin-btn"
              disabled={busy}
              onClick={() =>
                void runAction(
                  { type: "refund_escrow", jobId: selectedJobId },
                  "Enter password to refund escrow to the motorist.",
                )
              }
            >
              Refund motorist
            </button>
            <button
              type="button"
              className="om-admin-btn"
              disabled={busy}
              onClick={() =>
                void runAction(
                  {
                    type: "resolve_dispute",
                    jobId: selectedJobId,
                    outcome: "full_release_pro",
                    kind: "dispute",
                  },
                  "Enter password to resolve dispute in favour of the pro.",
                )
              }
            >
              Dispute → pay pro
            </button>
            <button
              type="button"
              className="om-admin-btn"
              disabled={busy}
              onClick={() =>
                void runAction(
                  {
                    type: "resolve_dispute",
                    jobId: selectedJobId,
                    outcome: "full_refund_motorist",
                    kind: "dispute",
                  },
                  "Enter password to resolve dispute with a full refund.",
                )
              }
            >
              Dispute → refund
            </button>
            {job?.motoristId || job?.motorist_id ? (
              <>
                <button
                  type="button"
                  className="om-admin-btn"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      {
                        type: "freeze_user",
                        userId: String(job?.motoristId || job?.motorist_id),
                      },
                      "Enter password to freeze this motorist account.",
                    )
                  }
                >
                  Freeze motorist
                </button>
                <button
                  type="button"
                  className="om-admin-btn"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      {
                        type: "unfreeze_user",
                        userId: String(job?.motoristId || job?.motorist_id),
                      },
                      "Enter password to unfreeze this motorist account.",
                    )
                  }
                >
                  Unfreeze motorist
                </button>
              </>
            ) : null}
            {job?.repairProId || job?.repair_pro_id ? (
              <button
                type="button"
                className="om-admin-btn"
                disabled={busy}
                onClick={() =>
                  void runAction(
                    {
                      type: "freeze_user",
                      userId: String(job?.repairProId || job?.repair_pro_id),
                    },
                    "Enter password to freeze this Repair Pro account.",
                  )
                }
              >
                Freeze pro
              </button>
            ) : null}
          </div>
          <p
            className="om-admin-muted"
            style={{ marginTop: "0.75rem", fontSize: 12 }}
          >
            Each money/freeze action opens a password popup first. Logged in the
            audit trail with your staff ID and IP.
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            <Link href="/admin/audit">View audit trail →</Link>
          </p>
        </div>
      )}
    </div>
  );
}
