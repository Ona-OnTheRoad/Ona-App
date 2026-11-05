"use client";

import Image from "next/image";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";

export default function AdminShopPage() {
  const { adminName } = useAdminGate();

  return (
    <AdminShell
      adminName={adminName}
      title="Shop orders & delivery"
      subtitle="Parts orders, fulfillment, and delivery logs."
      guideKey="shop"
    >
      {/* Centered Empty State / Dashboard Card */}
      <div className="w-full bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-2xl min-h-[520px] lg:min-h-[600px] flex flex-col items-center justify-center p-6 sm:p-12 text-center shadow-xs">
        <div className="relative w-48 h-40 sm:w-56 sm:h-48">
          <Image
            src="/images/shop-orders-icon.png"
            alt="Shop management dashboard"
            fill
            sizes="224px"
            className="object-contain"
            priority
          />
        </div>

        <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-6">
          Shop management dashboard.
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 max-w-sm">
          Use the admin API routes for shop operations.
        </p>
      </div>
    </AdminShell>
  );
}
