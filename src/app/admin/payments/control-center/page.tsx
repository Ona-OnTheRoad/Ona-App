"use client";

import Image from "next/image";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAdminGate } from "@/components/admin/use-admin-gate";

export default function PaymentControlCenterPage() {
  const { adminName } = useAdminGate();

  return (
    <AdminShell
      adminName={adminName}
      title="Payment Control Center"
      subtitle="Escrow balances, payouts, and transaction logs."
      guideKey="payments-control"
    >
      {/* Centered Empty State / Dashboard Card */}
      <div className="w-full bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-2xl min-h-[520px] lg:min-h-[600px] flex flex-col items-center justify-center p-6 sm:p-12 text-center shadow-xs">
        <div className="relative w-48 h-32 sm:w-56 sm:h-36">
          <Image
            src="/images/payment-control-center-icon.png"
            alt="Payment management dashboard"
            fill
            sizes="224px"
            className="object-contain"
            priority
          />
        </div>

        <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-6">
          Payment management dashboard.
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 max-w-sm">
          Use the admin API routes for payment operations.
        </p>
      </div>
    </AdminShell>
  );
}
