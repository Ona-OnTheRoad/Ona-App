import { styles } from "./styles";
import type { Detail } from "./types";

type Props = {
  detail: Detail;
  selectedId: string;
  esc: string;
  alreadyPaid: boolean;
  busy: boolean;
  canCancel: boolean;
  canForce: boolean;
  canRetry: boolean;
  note: string;
  setNote: (v: string) => void;
  setError: (v: string | null) => void;
  loadDetail: (id: string) => Promise<void>;
  runAction: (body: Record<string, unknown>, okMsg: string) => Promise<void>;
};

export function DetailActions({
  detail,
  selectedId,
  esc,
  alreadyPaid,
  busy,
  canCancel,
  canForce,
  canRetry,
  note,
  setNote,
  setError,
  loadDetail,
  runAction,
}: Props) {
  return (
    <>
      <p
        style={{
          fontSize: 12,
          color: "#6b7280",
          margin: "0 0 6px",
        }}
      >
        Reason note (required for sensitive actions):
      </p>
      <textarea
        style={styles.textarea}
        rows={2}
        placeholder="e.g. Force payout, customer refund..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 8,
        }}
      >
        <button
          style={styles.btn}
          onClick={() => {
            void loadDetail(selectedId);
          }}
          disabled={busy}
        >
          Refresh
        </button>
        {canCancel ? (
          <button
            style={styles.btnDanger}
            disabled={busy || alreadyPaid || esc === "refunded"}
            onClick={() => {
              const r = note.trim();
              if (r.length < 8) {
                setError("Note min 8 chars");
                return;
              }
              void runAction(
                {
                  id: selectedId,
                  action: "cancel_escrow",
                  reason: r,
                  jobId: detail.payment.request_id || undefined,
                  status: "refunded",
                },
                "Escrow cancelled / refunded",
              );
            }}
          >
            Refund customer
          </button>
        ) : null}
        {canCancel ? (
          <button
            style={styles.btn}
            disabled={busy || alreadyPaid || esc === "refunded"}
            onClick={() => {
              const r = note.trim();
              if (r.length < 8) {
                setError("Note min 8 chars");
                return;
              }
              void runAction(
                {
                  id: selectedId,
                  action: "cancel_processing",
                  reason: r,
                  jobId: detail.payment.request_id || undefined,
                },
                "Processing stopped",
              );
            }}
          >
            Stop processing
          </button>
        ) : null}
        {canForce ? (
          <button
            style={styles.btnPrimary}
            disabled={busy || alreadyPaid || esc === "refunded"}
            onClick={() => {
              const r = note.trim();
              if (r.length < 8) {
                setError("Note min 8 chars");
                return;
              }
              if (!window.confirm("Force payout? Same ref no double pay."))
                return;
              void runAction(
                {
                  id: selectedId,
                  action: "force_release",
                  jobId: detail.payment.request_id || selectedId,
                  reason: r,
                },
                "Force payout submitted",
              );
            }}
          >
            Force payout to pro
          </button>
        ) : null}
        {canRetry ? (
          <button
            style={styles.btn}
            disabled={busy}
            onClick={() => {
              void runAction(
                {
                  id: selectedId,
                  action: "retry_payout",
                  jobId: detail.payment.request_id || selectedId,
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
        <p style={{ ...styles.muted, marginTop: 8 }}>
          Read-only view. Force/refund requires L3+.
        </p>
      ) : null}
    </>
  );
}
