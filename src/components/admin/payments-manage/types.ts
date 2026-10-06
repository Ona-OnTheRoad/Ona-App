export type Payment = {
  id: string;
  request_id?: string | null;
  amount_kobo: number;
  currency: string;
  status: string;
  escrow_status?: string | null;
  effective_status?: string | null;
  display_status?: string | null;
  provider?: string;
  provider_ref?: string | null;
  created_at: string;
  paid_at?: string | null;
  released_at?: string | null;
  refunded_at?: string | null;
  payout_status?: string | null;
  payout_suspended?: boolean | null;
  next_retry_at?: string | null;
  retry_count?: number | null;
  last_release_error?: string | null;
  last_available_ngn?: number | null;
  last_ledger_ngn?: number | null;
  meta?: Record<string, unknown> | null;
  platform_fee_kobo?: number | null;
  pro_payout_kobo?: number | null;
};

export type Detail = {
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
  ledger: {
    id: string;
    transferRef: string;
    status: string;
    amountMinor: number;
    createdAt: string;
  }[];
  flwTransfers: {
    id: string | null;
    reference: string | null;
    status: string | null;
    amount: number | null;
    created_at: string | null;
    bank_name: string | null;
    account_number: string | null;
  }[];
  doublePayRisk: string | null;
  flwLookup: { found?: boolean; status?: string; reference?: string };
};

export type Ops = {
  flw: { available: number | null; ledger: number | null; refreshedAt: string };
  ona: {
    escrowHeldMinor: number;
    pendingSettlementMinor: number;
    pendingSettlementCount: number;
    releasedCount: number;
    failedCount: number;
    disputedCount: number;
    refundedCount: number;
  };
};

export type FilterKey =
  | "all"
  | "held"
  | "pending_settlement"
  | "suspended"
  | "released"
  | "failed"
  | "refunded";

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "held", label: "Held" },
  { key: "pending_settlement", label: "Pending" },
  { key: "suspended", label: "Suspended" },
  { key: "released", label: "Paid" },
  { key: "failed", label: "Failed" },
  { key: "refunded", label: "Refunded" },
];
