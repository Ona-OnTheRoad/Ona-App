export interface BankChangeFlowProps {
  isLight: boolean;
  currentBank?: {
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankCode?: string | null;
  };
  /** Unused: the server reads the phone number from the account. Kept so existing callers compile. */
  userPhone?: string;
  accessToken: string;
  onBankChanged: (bank: {
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankCode: string;
  }) => void;
}

export type Step =
  "idle" | "send_otp" | "verify_otp" | "form" | "confirming" | "done" | "error";
