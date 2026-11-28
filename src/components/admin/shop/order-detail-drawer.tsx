"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DetailDrawer } from "@/components/admin/admin-ui/detail-drawer";
import { fmtDate } from "@/components/admin/admin-ui/admin-ui-parts";
import {
  DELIVERY_TRANSITIONS,
  type DeliveryStatus,
} from "@/lib/shop/delivery-transitions";
import {
  DELIVERABLE,
  REFUNDABLE,
  label,
  money,
  type AdminShopOrderDetail,
} from "./types";

const input =
  "w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18171c] px-3 py-2 text-sm text-gray-900 dark:text-white";
const btn =
  "rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed";
const section =
  "mt-5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400";

type Props = {
  open: boolean;
  detail: AdminShopOrderDetail | null;
  loading: boolean;
  busy: boolean;
  onClose: () => void;
  onOrderAction: (a: "cancel" | "refund", reason?: string) => Promise<void>;
  onSaveDelivery: (v: {
    status?: string;
    courierName?: string;
    courierPhone?: string;
    trackingCode?: string;
    notes?: string;
  }) => Promise<void>;
};

export function OrderDetailDrawer({
  open,
  detail,
  loading,
  busy,
  onClose,
  onOrderAction,
  onSaveDelivery,
}: Props) {
  const d = detail?.delivery;
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [notes, setNotes] = useState("");
  const [nextStatus, setNextStatus] = useState("");

  useEffect(() => {
    setCourierName(d?.courier_name ?? "");
    setCourierPhone(d?.courier_phone ?? "");
    setTrackingCode(d?.tracking_code ?? "");
    setNotes(d?.notes ?? "");
    setNextStatus("");
  }, [d?.status, d?.courier_name, d?.courier_phone, d?.tracking_code, d?.notes, detail?.order.id]);

  const o = detail?.order;
  const canRefund = o ? REFUNDABLE.includes(o.status) : false;
  const canCancel = o?.status === "pending_payment";
  const canDeliver = o ? DELIVERABLE.includes(o.status) && !!d : false;
  const nextOptions: DeliveryStatus[] = d
    ? DELIVERY_TRANSITIONS[d.status as DeliveryStatus] ?? []
    : [];
  const ship = (o?.ship_to_snapshot ?? {}) as Record<string, unknown>;

  const confirmRefund = () => {
    const reason = window.prompt(
      `Refund ${money(o!.total_minor, o!.currency)} for ${o!.order_number} to the customer's original payment method?\n\nOptional reason:`,
      "",
    );
    if (reason === null) return;
    void onOrderAction("refund", reason);
  };
  const confirmCancel = () => {
    if (!window.confirm(`Cancel unpaid order ${o!.order_number}?`)) return;
    void onOrderAction("cancel");
  };

  return (
    <DetailDrawer
      open={open}
      title={o ? `Order ${o.order_number}` : "Order"}
      subtitle={o ? label(o.status) : undefined}
      onClose={onClose}
      width={520}
    >
      {loading || !detail || !o ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-ona-brand" />
        </div>
      ) : (
        <div className="space-y-1 text-sm text-gray-900 dark:text-gray-100">
          {o.refund_error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            >
              <p className="font-semibold">Refund needs attention</p>
              <p className="mt-0.5 text-xs">{o.refund_error}</p>
              <p className="mt-1 text-xs">
                The customer has been charged. Fix the cause (e.g. top up the
                gateway balance) and press Refund again.
              </p>
            </div>
          ) : null}

          <p className={section}>Customer</p>
          <p>
            {detail.buyer?.full_name || "Unknown"}{" "}
            <span className="text-gray-500">
              {detail.buyer?.phone ? `· ${detail.buyer.phone}` : ""}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            {label(o.account_context)} account · placed {fmtDate(o.created_at)}
          </p>

          <p className={section}>Items</p>
          {detail.items.map((it) => (
            <div key={it.id} className="flex justify-between gap-3">
              <span>
                {it.qty}× {it.product_name}
                {it.variant_title ? ` (${it.variant_title})` : ""}
                {it.sku ? <span className="text-gray-500"> · {it.sku}</span> : null}
              </span>
              <span className="tabular-nums">{money(it.line_total_minor, o.currency)}</span>
            </div>
          ))}
          <div className="mt-2 border-t border-gray-200 pt-2 dark:border-white/10">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="tabular-nums">{money(o.subtotal_minor, o.currency)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery</span>
              <span className="tabular-nums">{money(o.delivery_fee_minor, o.currency)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{money(o.total_minor, o.currency)}</span>
            </div>
          </div>

          <p className={section}>Payment</p>
          {detail.payments.length === 0 ? (
            <p className="text-gray-500">No payment started.</p>
          ) : (
            detail.payments.map((p) => (
              <p key={p.id}>
                <span className="font-semibold capitalize">{p.provider}</span> ·{" "}
                {money(p.amount_minor, o.currency)} ·{" "}
                <span className="capitalize">{p.status}</span>
                <span className="block text-xs text-gray-500">{p.provider_ref}</span>
              </p>
            ))
          )}

          <p className={section}>Delivery address</p>
          <p>
            {ship.address ? String(ship.address) : "No address"}
            {ship.label ? <span className="text-gray-500"> · {String(ship.label)}</span> : null}
          </p>

          {d ? (
            <>
              <p className={section}>Delivery · {label(d.status)}</p>
              {canDeliver ? (
                <div className="mt-1 space-y-2">
                  <input className={input} placeholder="Courier name" value={courierName} onChange={(e) => setCourierName(e.target.value)} />
                  <input className={input} placeholder="Courier phone" value={courierPhone} onChange={(e) => setCourierPhone(e.target.value)} />
                  <input className={input} placeholder="Tracking code" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} />
                  <input className={input} placeholder="Note (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <select className={input} value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} aria-label="Move delivery to">
                    <option value="">Keep status: {label(d.status)}</option>
                    {nextOptions.map((s) => (
                      <option key={s} value={s}>
                        Move to: {label(s)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    className={`${btn} bg-ona-brand text-white`}
                    onClick={() =>
                      void onSaveDelivery({
                        status: nextStatus || undefined,
                        courierName: courierName || undefined,
                        courierPhone: courierPhone || undefined,
                        trackingCode: trackingCode || undefined,
                        notes: notes || undefined,
                      })
                    }
                  >
                    {busy ? "Saving…" : "Save delivery"}
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">
                  Delivery cannot be changed while the order is {label(o.status)}.
                </p>
              )}
            </>
          ) : null}

          {canRefund || canCancel ? (
            <>
              <p className={section}>Order actions</p>
              <div className="flex gap-2">
                {canRefund ? (
                  <button type="button" disabled={busy} className={`${btn} bg-red-600 text-white`} onClick={confirmRefund}>
                    {o.status === "refund_pending" ? "Retry refund" : "Refund order"}
                  </button>
                ) : null}
                {canCancel ? (
                  <button type="button" disabled={busy} className={`${btn} border border-gray-300 dark:border-white/15`} onClick={confirmCancel}>
                    Cancel order
                  </button>
                ) : null}
              </div>
            </>
          ) : null}

          <p className={section}>Timeline</p>
          {detail.events.map((e) => (
            <p key={e.id} className="text-xs">
              <span className="font-semibold capitalize">{label(e.event_type)}</span>{" "}
              <span className="text-gray-500">{fmtDate(e.created_at)}</span>
            </p>
          ))}
        </div>
      )}
    </DetailDrawer>
  );
}
