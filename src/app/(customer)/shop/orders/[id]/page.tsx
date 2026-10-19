"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MapPin, Truck } from "lucide-react";
import { onaEyebrowClass } from "@/components/ui/ona-field";
import { OnaScreen } from "@/components/ui/ona-screen";
import { orderStatusTone } from "@/components/shop/shared/order-status-tone";
import { detectCurrency, formatMoney, fromMinorUnits } from "@/lib/pricing";
import { shopGetOrder } from "@/lib/shop/client";
import { useApp } from "@/lib/store";

type Delivery = {
  status?: string | null;
  courier_name?: string | null;
  zone_name?: string | null;
  service_code?: string | null;
  eta_minutes?: number | null;
  tracking_code?: string | null;
  address_snapshot?: Record<string, unknown> | null;
};

type OrderEvent = {
  id: string;
  event_type: string;
  note?: string | null;
  created_at?: string;
};

function formatPrice(minor: number | null | undefined): string {
  if (minor == null) return "";
  return formatMoney(fromMinorUnits(minor, "NGN"), detectCurrency());
}

export default function ShopOrderDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { accountType } = useApp();
  const router = useRouter();
  const ctx = accountType === "professional" ? "professional" : "motorist";
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([]);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await shopGetOrder(id, ctx);
        if (cancelled) return;
        setOrder(data.order);
        setItems(data.items);
        setDelivery((data.delivery as Delivery | null) ?? null);
        setPayments(data.payments ?? []);
        setEvents(
          ((data.events ?? []) as OrderEvent[]).sort((a, b) =>
            String(a.created_at).localeCompare(String(b.created_at)),
          ),
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, ctx]);

  const card = "rounded-ona-card border border-ona-border bg-ona-surface";
  const orderStatus = String(order?.status || "pending");

  const ship = (delivery?.address_snapshot ??
    order?.ship_to_snapshot ??
    {}) as Record<string, unknown>;

  return (
    <OnaScreen onBack={() => router.push("/shop/orders")}>
      <div className="pt-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2
              aria-label="Loading order"
              className="h-8 w-8 animate-spin text-ona-brand-ink"
            />
          </div>
        ) : error || !order ? (
          <p
            role="alert"
            className="py-8 text-center text-[13px] text-ona-danger"
          >
            {error || "Not found"}
          </p>
        ) : (
          <>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight text-ona-ink">
              Order
            </h1>
            <div className={`${card} mt-4 p-3 text-ona-ink`}>
              <p className="text-[15px] font-semibold">
                {String(order.order_number)}
              </p>
              <p
                className={`mt-1 text-[12px] font-semibold capitalize ${orderStatusTone(orderStatus)}`}
              >
                {orderStatus.replace(/_/g, " ")}
              </p>
              <p className="mt-2 text-[13px] text-ona-muted">
                Total{" "}
                <span className="font-semibold tabular-nums text-ona-brand-ink">
                  {formatPrice(Number(order.total_minor))}
                </span>
                {order.refunded_at ? (
                  <span className="ml-1 text-[11px] font-semibold text-ona-danger">
                    (refunded)
                  </span>
                ) : null}
              </p>
            </div>

            <p className={`${onaEyebrowClass} mb-1.5 mt-5`}>Items</p>
            <div className="flex flex-col gap-1.5">
              {items.map((it) => (
                <div
                  key={String(it.id)}
                  className={`${card} p-2.5 text-[12px] text-ona-ink`}
                >
                  <div className="flex justify-between gap-2">
                    <span>
                      {Number(it.qty)}× {String(it.product_name)}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatPrice(Number(it.line_total_minor))}
                    </span>
                  </div>
                  {it.sku ? (
                    <p className="mt-0.5 text-[11px] text-ona-muted">
                      SKU {String(it.sku)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <p className={`${onaEyebrowClass} mb-1.5 mt-5`}>Delivery</p>
            <div className={`${card} p-3 text-[12px] text-ona-ink`}>
              <div className="flex items-center justify-between">
                <p
                  className={`font-semibold capitalize ${orderStatusTone(String(delivery?.status || "pending"))}`}
                >
                  {String(delivery?.status || "pending").replace(/_/g, " ")}
                </p>
                {delivery?.eta_minutes != null ? (
                  <p className="font-semibold text-ona-muted">
                    <Truck aria-hidden className="mr-1 inline h-3.5 w-3.5" />~
                    {delivery.eta_minutes} min ETA
                  </p>
                ) : null}
              </div>
              {delivery?.zone_name ? (
                <p className="mt-1.5 text-ona-muted">
                  Zone: {String(delivery.zone_name)}
                  {delivery.service_code
                    ? ` · ${String(delivery.service_code).replace(/_/g, " ")}`
                    : ""}
                </p>
              ) : null}
              {ship.address ? (
                <p className="mt-1 flex items-start gap-1 text-ona-muted">
                  <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {String(ship.label)} · {String(ship.address)}
                </p>
              ) : null}
              {delivery?.courier_name ? (
                <p className="mt-1 text-ona-muted">
                  Courier: {String(delivery.courier_name)}
                  {delivery.tracking_code
                    ? ` · ${String(delivery.tracking_code)}`
                    : ""}
                </p>
              ) : (
                <p className="mt-1 text-ona-muted">
                  Awaiting courier assignment (admin).
                </p>
              )}
            </div>

            {payments.length > 0 ? (
              <>
                <p className={`${onaEyebrowClass} mb-1.5 mt-5`}>Payment</p>
                <div className={`${card} p-3 text-[12px] text-ona-ink`}>
                  {payments.map((p, i) => (
                    <div
                      key={String(p.id)}
                      className={
                        i > 0 ? "mt-1.5 border-t border-ona-border pt-1.5" : ""
                      }
                    >
                      <span className="font-semibold capitalize">
                        {String(p.provider)}
                      </span>{" "}
                      · {formatPrice(Number(p.amount_minor))} ·{" "}
                      <span className="text-ona-muted">
                        {String(p.reference)}
                      </span>
                      {p.refunded_at ? (
                        <span className="ml-1 text-[11px] font-semibold text-ona-danger">
                          (refunded)
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {events.length > 0 ? (
              <>
                <p className={`${onaEyebrowClass} mb-1.5 mt-5`}>Timeline</p>
                <div className="flex flex-col gap-2">
                  {events.map((e) => (
                    <div key={e.id} className="flex items-start gap-2 px-0.5">
                      <CheckCircle2
                        aria-hidden
                        className="mt-0.5 h-4 w-4 shrink-0 text-ona-success"
                      />
                      <div>
                        <p className="text-[12px] font-semibold capitalize text-ona-ink">
                          {String(e.event_type).replace(/_/g, " ")}
                        </p>
                        {e.note ? (
                          <p className="text-[11px] text-ona-muted">{e.note}</p>
                        ) : null}
                        <p className="text-[10px] text-ona-muted">
                          {e.created_at
                            ? new Date(e.created_at).toLocaleString()
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </OnaScreen>
  );
}
