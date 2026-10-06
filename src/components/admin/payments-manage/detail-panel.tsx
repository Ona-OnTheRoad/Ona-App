import { DetailActions } from "./detail-actions";
import { DetailParties } from "./detail-parties";
import { DetailSummary } from "./detail-summary";
import { DetailTables } from "./detail-tables";
import { styles } from "./styles";
import type { Detail } from "./types";

type Props = {
  selectedId: string;
  detail: Detail | null;
  detailLoading: boolean;
  esc: string;
  meta: Record<string, unknown>;
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
  onClose: () => void;
};

export function DetailPanel({
  selectedId,
  detail,
  detailLoading,
  esc,
  meta,
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
  onClose,
}: Props) {
  return (
    <div style={{ flex: "0 0 50%", minWidth: 400 }}>
      <div style={styles.panel}>
        <div
          style={{
            ...styles.flex,
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Payment Control
          </h2>
          <button style={{ ...styles.btn, fontSize: 11 }} onClick={onClose}>
            Close
          </button>
        </div>
        {detailLoading ? (
          <p style={styles.muted}>Loading detail...</p>
        ) : !detail ? (
          <p style={styles.muted}>Select a payment</p>
        ) : (
          <>
            <DetailParties detail={detail} />
            <DetailSummary detail={detail} esc={esc} meta={meta} />
            <DetailActions
              detail={detail}
              selectedId={selectedId}
              esc={esc}
              alreadyPaid={alreadyPaid}
              busy={busy}
              canCancel={canCancel}
              canForce={canForce}
              canRetry={canRetry}
              note={note}
              setNote={setNote}
              setError={setError}
              loadDetail={loadDetail}
              runAction={runAction}
            />
            <DetailTables detail={detail} />
          </>
        )}
      </div>
    </div>
  );
}
