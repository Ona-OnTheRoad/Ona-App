"use client";

import { fmtDate, StatusBadge } from "@/components/admin/admin-ui/admin-ui-parts";
import { label, money, type AdminShopOrderRow } from "./types";

function badgeStatus(s: string): string {
  if (["paid", "delivered", "fulfilling", "out_for_delivery"].includes(s)) return "approved";
  if (["pending_payment", "refund_pending"].includes(s)) return "pending";
  if (["cancelled", "refunded"].includes(s)) return "rejected";
  return s;
}

export function ShopOrdersTable({
  orders,
  onOpen,
}: {
  orders: AdminShopOrderRow[];
  onOpen: (id: string) => void;
}) {
  if (orders.length === 0) {
    return (
      <p className="px-6 py-14 text-center text-sm text-gray-500 dark:text-gray-400">
        No orders match this filter.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-y border-gray-200 bg-[#f8f9fa] text-xs font-semibold text-gray-600 dark:border-white/5 dark:bg-[#18171c] dark:text-gray-400">
            <th className="px-6 py-3.5">Order</th>
            <th className="px-6 py-3.5">Customer</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">Delivery</th>
            <th className="px-6 py-3.5 text-right">Total</th>
            <th className="px-6 py-3.5">Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
              onClick={() => onOpen(o.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") onOpen(o.id);
              }}
            >
              <td className="px-6 py-3.5 font-semibold text-gray-900 dark:text-white">
                {o.order_number}
                {o.refund_error ? (
                  <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                    ACTION
                  </span>
                ) : null}
              </td>
              <td className="px-6 py-3.5 text-gray-700 dark:text-gray-300">
                {o.buyer?.full_name || "Unknown"}
                <span className="block text-xs text-gray-500">{o.buyer?.phone || ""}</span>
              </td>
              <td className="px-6 py-3.5">
                <StatusBadge status={badgeStatus(o.status)}>{label(o.status)}</StatusBadge>
              </td>
              <td className="px-6 py-3.5 text-gray-700 dark:text-gray-300">
                {o.delivery?.status ? label(o.delivery.status) : "—"}
                {o.delivery?.courier_name ? (
                  <span className="block text-xs text-gray-500">{o.delivery.courier_name}</span>
                ) : null}
              </td>
              <td className="px-6 py-3.5 text-right tabular-nums text-gray-900 dark:text-white">
                {money(o.total_minor, o.currency || "NGN")}
              </td>
              <td className="px-6 py-3.5 text-gray-500">{fmtDate(o.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
