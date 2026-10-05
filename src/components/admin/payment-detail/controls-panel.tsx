export type RunAction = (
  title: string,
  detail: string,
  body: Record<string, unknown>,
  okMsg: string,
) => Promise<void>;

export function ControlsPanel({
  p,
  esc,
  note,
  setNote,
  busy,
  alreadyPaid,
  canCancel,
  canForce,
  load,
  requireNote,
  runAction,
}: {
  p: Record<string, unknown>;
  esc: string;
  note: string;
  setNote: (v: string) => void;
  busy: boolean;
  alreadyPaid: boolean;
  canCancel: boolean;
  canForce: boolean;
  load: () => Promise<void>;
  requireNote: () => string | null;
  runAction: RunAction;
}) {
  return (
    <div className="om-admin-panel" style={{ marginBottom: 16 }}>
      <h2 className="om-admin-h2" style={{ marginTop: 0 }}>
        Admin controls
      </h2>
      <p className="om-admin-muted" style={{ fontSize: 12, marginTop: 0 }}>
        Reason note (required for stop / force / refund min 8 characters):
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="e.g. FLW Available funded force release · or customer dispute refund"
        style={{
          width: "100%",
          marginBottom: 12,
          padding: 8,
          fontSize: 13,
          borderRadius: 6,
          border: "1px solid #d1d5db",
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          className="om-admin-btn-ghost"
          disabled={busy}
          onClick={() => void load()}
        >
          Refresh status
        </button>

        {canCancel || canForce ? (
          <button
            type="button"
            className="om-admin-btn-ghost"
            disabled={busy || alreadyPaid || esc === "refunded"}
            onClick={() => {
              const r = requireNote();
              if (!r) return;
              void runAction(
                "Stop auto-processing",
                "Stops retries. Funds stay in escrow (not a refund).",
                {
                  id: String(p.id),
                  action: "cancel_processing",
                  reason: r,
                  jobId: p.request_id || undefined,
                },
                "Processing stopped funds held for manual control",
              );
            }}
          >
            Stop processing
          </button>
        ) : null}

        {canForce ? (
          <button
            type="button"
            className="om-admin-btn"
            disabled={busy || alreadyPaid || esc === "refunded"}
            onClick={() => {
              const r = requireNote();
              if (!r) return;
              if (
                !window.confirm(
                  "Force payout uses the SAME transfer reference. If FLW already paid, it will not pay twice. Continue?",
                )
              ) {
                return;
              }
              void runAction(
                "Force pro payout",
                "Idempotent FLW transfer (L4-L5). Same ref no double pay.",
                {
                  id: String(p.id),
                  action: "force_release",
                  jobId: p.request_id || p.id,
                  reason: r,
                },
                "Force payout submitted",
              );
            }}
          >
            Force payout to pro
          </button>
        ) : null}

        {canCancel ? (
          <button
            type="button"
            className="om-admin-btn-ghost"
            disabled={busy || esc === "released" || esc === "refunded"}
            style={{ color: "#b91c1c" }}
            onClick={() => {
              const r = requireNote();
              if (!r) return;
              if (
                !window.confirm(
                  "Refund / cancel escrow? This marks the payment refunded and stops payout.",
                )
              ) {
                return;
              }
              void runAction(
                "Cancel escrow / refund",
                "Marks escrow refunded. Sensitive action.",
                {
                  id: String(p.id),
                  action: "cancel_escrow",
                  reason: r,
                  status: "refunded",
                  jobId: p.request_id || undefined,
                },
                "Escrow cancelled / refunded",
              );
            }}
          >
            Refund customer
          </button>
        ) : null}

        {canCancel && !canForce ? (
          <button
            type="button"
            className="om-admin-btn-ghost"
            disabled={busy || alreadyPaid}
            onClick={() => {
              void runAction(
                "Retry pro payout",
                "Idempotent retry (respects 10‑min spacing unless already due).",
                {
                  id: String(p.id),
                  action: "retry_payout",
                  jobId: p.request_id || p.id,
                },
                "Retry submitted",
              );
            }}
          >
            Retry payout
          </button>
        ) : null}
      </div>
      {!canForce && !canCancel ? (
        <p className="om-admin-muted" style={{ fontSize: 12, marginTop: 10 }}>
          Your level can view status only. Force / refund needs L3+ (refund) or
          L4-L5 (force).
        </p>
      ) : null}
    </div>
  );
}
