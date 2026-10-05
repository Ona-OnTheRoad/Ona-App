export type BankTransferInfo = {
  accountNumber: string;
  bankName: string;
  accountName: string;
  amountMajor: number;
  currency: string;
  expiresAt: string | null;
  note: string;
  flwRef: string | null;
};

export type Phase =
  | "summary"
  | "paying"
  | "bank_pay" // in-app VA details + poll
  | "mock_embed"
  | "error"
  | "expired";

/** Theme-derived class tokens shared by the checkout views. */
export type CheckoutTone = {
  isLight: boolean;
  card: string;
  ink: string;
  muted: string;
};
