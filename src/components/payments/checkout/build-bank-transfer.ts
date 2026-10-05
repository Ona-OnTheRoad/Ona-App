import type { apiPayJob } from "@/lib/jobs/client";
import type { BankTransferInfo } from "./types";

type PayJobResult = Awaited<ReturnType<typeof apiPayJob>>;
export type PayBankTransfer = (PayJobResult & {
  ok: true;
})["data"]["bankTransfer"];

/**
 * Normalise the server bank-transfer payload into display info.
 * Returns null when there is no usable account number.
 */
export function buildBankTransferInfo(
  bt: PayBankTransfer,
  agreedMajor: number | null | undefined,
): BankTransferInfo | null {
  const accountNumber = String(bt?.accountNumber || "").trim();
  if (!accountNumber) return null;
  // Account name = bank recipient only (Ona escrow). Never instruction copy.
  let accountName = String(bt?.accountName || "Ona").trim() || "Ona";
  if (
    /please\s|make a bank transfer|transfer to|exact amount/i.test(
      accountName,
    ) ||
    accountName.length > 48
  ) {
    accountName = "Ona";
  }
  let note = String(
    bt?.note ||
      "Pay into Ona escrow (account below). Funds are released after the job is confirmed. Transfer the exact amount only.",
  ).trim();
  // Normalize older copy
  note = note
    .replace(/\(account above\)/gi, "(account below)")
    .replace(/Funds release after/gi, "Funds are released after");
  // If note was wrongly duplicated into account name historically, clean it
  if (/^please\s+make\s+a\s+bank\s+transfer\s+to\s+/i.test(note)) {
    const pro = note.replace(
      /^please\s+make\s+a\s+bank\s+transfer\s+to\s+/i,
      "",
    );
    note = `For ${pro}. Pay into Ona escrow (account below). Funds are released after the job is confirmed. Transfer the exact amount only.`;
  }
  return {
    accountNumber,
    bankName: String(bt?.bankName || "Flutterwave MFB"),
    accountName,
    amountMajor: Number(bt?.amountMajor || agreedMajor || 0),
    currency: String(bt?.currency || "NGN"),
    expiresAt: bt?.expiresAt ?? null,
    note,
    flwRef: bt?.flwRef ?? null,
  };
}
