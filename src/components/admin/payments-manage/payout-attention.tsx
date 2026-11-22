import { naira, payoutAttention } from "./helpers";
import type { Ops, Payment } from "./types";

const box = (tone: "warn" | "bad") =>
  ({
    margin: "0 0 12px",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.45,
    border: `1px solid ${tone === "bad" ? "#fecaca" : "#fde68a"}`,
    background: tone === "bad" ? "#fef2f2" : "#fffbeb",
    color: tone === "bad" ? "#991b1b" : "#92400e",
  }) as const;

/**
 * Shown above the ops cards when payouts need a human: either Flutterwave
 * Available cannot cover what is owed (they keep retrying), or a payout stopped
 * retrying and must be released manually.
 */
export function PayoutAttention({
  ops,
  payments,
}: {
  ops: Ops | null;
  payments: Payment[];
}) {
  const { floatShort, suspended } = payoutAttention(ops, payments);
  if (!floatShort && suspended.count === 0) return null;
  return (
    <div role="status">
      {floatShort ? (
        <div style={box("warn")}>
          <strong>Payouts are waiting on Flutterwave balance.</strong> Available{" "}
          {`₦${floatShort.availableNgn.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}{" "}
          is {`₦${floatShort.shortNgn.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}{" "}
          short of {naira(floatShort.owedMinor)} owed to {floatShort.pendingCount}{" "}
          Repair Pro{floatShort.pendingCount === 1 ? "" : "s"}. Top up Available,
          or wait for collected funds to settle; they retry every 10 minutes and
          are suspended after 24 hours.
        </div>
      ) : null}
      {suspended.count > 0 ? (
        <div style={box("bad")}>
          <strong>
            {suspended.count} payout{suspended.count === 1 ? "" : "s"} need a manual release
          </strong>{" "}
          ({naira(suspended.owedMinor)}). Automatic retries have ended. Fund
          Available, then release from the list below (Suspended filter).
        </div>
      ) : null}
    </div>
  );
}
