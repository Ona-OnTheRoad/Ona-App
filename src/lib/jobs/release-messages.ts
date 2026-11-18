/**
 * What the customer sees when releasing payment fails. The server's raw
 * messages are written for developers ("bank code + 10-digit account",
 * "Flutterwave IP whitelisting") and give a customer nothing to act on, so they
 * are translated here. The raw text is never shown to the customer.
 */
export type ReleaseErrorKind =
  /** The Repair Pro has not finished their bank details: not the customer's to fix. */
  | "pro_bank"
  /** The payout provider could not complete the transfer right now. */
  | "transfer"
  /** Anything else (connection, session, unknown). */
  | "other";

export type FriendlyReleaseError = {
  kind: ReleaseErrorKind;
  message: string;
  /** True when swiping again can't help until something changes on the pro's side. */
  blocksRelease: boolean;
};

const PRO_BANK = /bank incomplete|bank (?:details|account).*(?:missing|incomplete|not (?:set|verified|confirmed))/i;
const TRANSFER =
  /flutterwave|transfer|ip whitelist|ip policy|payout|settlement|below .*minimum|egress/i;

export function friendlyReleaseError(
  raw: string | null | undefined,
  proFirstName = "your Repair Pro",
): FriendlyReleaseError | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  if (PRO_BANK.test(text)) {
    return {
      kind: "pro_bank",
      blocksRelease: true,
      message: `Your payment is safe in escrow. ${proFirstName} still needs to finish adding their bank details before it can be paid out. We've asked them to, and it will release as soon as they do.`,
    };
  }
  if (TRANSFER.test(text)) {
    return {
      kind: "transfer",
      blocksRelease: false,
      message:
        "We couldn't send the payout just now. Your payment is safe in escrow. Please try again in a moment.",
    };
  }
  return { kind: "other", blocksRelease: false, message: text };
}
