export type AdminShopOrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_minor: number;
  currency: string | null;
  created_at: string;
  paid_at: string | null;
  refund_error: string | null;
  account_context: string | null;
  buyer: { full_name?: string | null; phone?: string | null } | null;
  delivery: { status?: string | null; courier_name?: string | null } | null;
};

export type AdminShopOrderDetail = {
  order: {
    id: string;
    order_number: string;
    status: string;
    currency: string;
    subtotal_minor: number;
    delivery_fee_minor: number;
    total_minor: number;
    ship_to_snapshot: Record<string, unknown> | null;
    notes: string | null;
    paid_at: string | null;
    refunded_at: string | null;
    refund_error: string | null;
    created_at: string;
    account_context: string;
  };
  buyer: { full_name?: string | null; phone?: string | null } | null;
  items: Array<{
    id: string;
    product_name: string;
    variant_title: string | null;
    sku: string | null;
    qty: number;
    line_total_minor: number;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    provider_ref: string | null;
    amount_minor: number;
    status: string;
    paid_at: string | null;
    refunded_at: string | null;
  }>;
  delivery: {
    status: string;
    courier_name: string | null;
    courier_phone: string | null;
    tracking_code: string | null;
    zone_name: string | null;
    eta_minutes: number | null;
    notes: string | null;
  } | null;
  events: Array<{ id: string; event_type: string; created_at: string }>;
};

export const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "fulfilling", label: "Fulfilling" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "refund_pending", label: "Refund pending" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

/** Order states in which ops can still refund (mirrors the server). */
export const REFUNDABLE = ["paid", "fulfilling", "out_for_delivery", "refund_pending"];
/** Order states in which the delivery can still be progressed (mirrors the server). */
export const DELIVERABLE = ["paid", "fulfilling", "out_for_delivery", "delivered"];

export function money(minor: number, currency = "NGN"): string {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

export function label(s: string): string {
  return s.replace(/_/g, " ");
}
