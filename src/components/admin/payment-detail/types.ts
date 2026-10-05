export type FlwTransfer = {
  id: string | null;
  reference: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  narration: string | null;
  complete_message: string | null;
  created_at: string | null;
  account_number: string | null;
  bank_name: string | null;
  fee: number | null;
};

export type LedgerRow = {
  id: string;
  transferRef: string;
  flwTransferId: string | null;
  amountMinor: number;
  currency: string;
  status: string;
  accountBank: string | null;
  accountNumberLast4: string | null;
  beneficiaryName: string | null;
  createdAt: string;
};

export type PaymentDetailData = {
  payment: Record<string, unknown>;
  job: Record<string, unknown> | null;
  parties?: {
    customer: {
      id: string | null;
      name: string;
      phone: string | null;
      email: string | null;
    };
    pro: {
      id: string | null;
      name: string;
      phone: string | null;
      email: string | null;
      bank: {
        bankCode: string | null;
        bankName: string | null;
        accountName: string | null;
        accountLast4: string | null;
        accountNumber: string | null;
      } | null;
    };
  };
  ledger: LedgerRow[];
  flwTransfers: FlwTransfer[];
  doublePayRisk: string | null;
  flwLookup: { found?: boolean; status?: string; reference?: string };
};
