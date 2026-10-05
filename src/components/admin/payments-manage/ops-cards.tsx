import { naira } from "./helpers";
import { styles } from "./styles";
import type { Ops } from "./types";

export function OpsCards({ ops }: { ops: Ops | null }) {
  return (
    <div style={styles.grid}>
      <div style={styles.card("available")}>
        <div style={styles.cardLabel}>FLW Available</div>
        <div style={styles.cardVal}>
          {ops
            ? `₦${(ops.flw.available ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
            : ""}
        </div>
        <div style={styles.cardSub}>Payout balance</div>
      </div>
      <div style={styles.card("ledger")}>
        <div style={styles.cardLabel}>FLW Ledger</div>
        <div style={styles.cardVal}>
          {ops
            ? `₦${(ops.flw.ledger ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
            : ""}
        </div>
        <div style={styles.cardSub}>Settling collections</div>
      </div>
      <div style={styles.card("held")}>
        <div style={styles.cardLabel}>Escrow held</div>
        <div style={styles.cardVal}>
          {ops ? naira(ops.ona.escrowHeldMinor) : ""}
        </div>
        <div style={styles.cardSub}>Paid, not released</div>
      </div>
      <div style={styles.card("pending")}>
        <div style={styles.cardLabel}>Pending settlement</div>
        <div style={styles.cardVal}>
          {ops ? naira(ops.ona.pendingSettlementMinor) : ""}
        </div>
        <div style={styles.cardSub}>
          {ops ? `${ops.ona.pendingSettlementCount} jobs` : ""}
        </div>
      </div>
      <div style={styles.card("released")}>
        <div style={styles.cardLabel}>Paid to pros</div>
        <div style={styles.cardVal}>
          {ops ? String(ops.ona.releasedCount) : ""}
        </div>
        <div style={styles.cardSub}>87.5% to pro</div>
      </div>
      <div style={styles.card("failed")}>
        <div style={styles.cardLabel}>Failed</div>
        <div style={styles.cardVal}>
          {ops ? String(ops.ona.failedCount) : ""}
        </div>
        <div style={styles.cardSub}>Needs admin</div>
      </div>
      <div style={styles.card("refunded")}>
        <div style={styles.cardLabel}>Refunded</div>
        <div style={styles.cardVal}>
          {ops ? String(ops.ona.refundedCount) : ""}
        </div>
        <div style={styles.cardSub}>Customer refunded</div>
      </div>
    </div>
  );
}
