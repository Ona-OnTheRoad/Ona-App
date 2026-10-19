"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { detectCurrency, formatMoney, fromMinorUnits } from "@/lib/pricing";
import { shopListOrders } from "@/lib/shop/client";
import { useApp } from "@/lib/store";
import { orderStatusTone } from "@/components/shop/shared/order-status-tone";

function formatPrice(minor: number | null | undefined): string {
  if (minor == null) return "";
  return formatMoney(fromMinorUnits(minor, "NGN"), detectCurrency());
}

export default function ShopOrdersPage() {
  const { isAuthenticated, accountType } = useApp();
  const router = useRouter();
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const ctx = accountType === "professional" ? "professional" : "motorist";

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await shopListOrders(ctx);
        if (!cancelled) setOrders(data.orders);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, ctx]);

  return (
    <OnaScreen onBack={() => router.push("/shop")}>
      <div className="pt-3">
        <OnaTitle title="Shop orders" />
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2
                aria-label="Loading orders"
                className="h-8 w-8 animate-spin text-ona-brand-ink"
              />
            </div>
          ) : orders.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-ona-muted">
              No shop orders yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {orders.map((o) => {
                const status = String(o.status);
                return (
                  <button
                    key={String(o.id)}
                    type="button"
                    onClick={() => router.push(`/shop/orders/${o.id}`)}
                    className="rounded-ona-card border border-ona-border bg-ona-surface p-3 text-left text-ona-ink"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-semibold">
                        {String(o.order_number)}
                      </p>
                      <p
                        className={`text-[11px] font-semibold capitalize ${orderStatusTone(status)}`}
                      >
                        {status.replace(/_/g, " ")}
                      </p>
                    </div>
                    <p className="mt-1 text-[12px] font-semibold tabular-nums">
                      {formatPrice(Number(o.total_minor))}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </OnaScreen>
  );
}
