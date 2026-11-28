"use client";

import { Loader2, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrderDetailDrawer } from "@/components/admin/shop/order-detail-drawer";
import { ShopOrdersTable } from "@/components/admin/shop/shop-orders-table";
import { STATUS_FILTERS } from "@/components/admin/shop/types";
import { useShopOrdersConsole } from "@/components/admin/shop/use-shop-orders-console";

export default function AdminShopPage() {
  const c = useShopOrdersConsole();

  return (
    <AdminShell
      adminName={c.adminName}
      title="Shop orders & delivery"
      subtitle="Parts orders, fulfillment, refunds and delivery."
      guideKey="shop"
    >
      <div className="w-full pb-16">
        {c.needsAttention > 0 ? (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
          >
            <strong>{c.needsAttention}</strong> order
            {c.needsAttention === 1 ? "" : "s"} paid but need a manual refund.{" "}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => c.setStatus("refund_pending")}
            >
              Show them
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#141318]">
          <div className="flex flex-wrap items-center gap-3 px-6 py-5">
            <h2 className="mr-auto text-base font-semibold text-gray-900 dark:text-white">
              Orders • {c.orders.length}
            </h2>
            <label className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={c.q}
                onChange={(e) => c.setQ(e.target.value)}
                placeholder="Order number"
                aria-label="Search by order number"
                className="rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm dark:border-white/10 dark:bg-[#18171c] dark:text-white"
              />
            </label>
            <select
              value={c.status}
              onChange={(e) => c.setStatus(e.target.value)}
              aria-label="Filter by status"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#18171c] dark:text-white"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {!c.ready || c.loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-ona-brand" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Loading orders...
              </p>
            </div>
          ) : (
            <ShopOrdersTable orders={c.orders} onOpen={c.open} />
          )}
        </div>
      </div>

      <OrderDetailDrawer
        open={c.selectedId !== null}
        detail={c.detail}
        loading={c.detailLoading}
        busy={c.busy}
        onClose={c.close}
        onOrderAction={c.orderAction}
        onSaveDelivery={c.saveDelivery}
      />
    </AdminShell>
  );
}
