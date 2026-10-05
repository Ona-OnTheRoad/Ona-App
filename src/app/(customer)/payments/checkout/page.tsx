"use client";

/**
 * Checkout shell bank transfer stays ON this Ona page.
 *
 * HARD RULES:
 * - Never open Flutterwave.com / new tabs / hosted pay (503 nginx).
 * - Server creates a Flutterwave VA; we show account + amount in-app.
 * - Poll until job is booked after customer transfers.
 */

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CheckoutInner } from "@/components/payments/checkout/checkout-inner";

export default function PaymentsCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#e8e9ed]">
          <Loader2 className="h-7 w-7 animate-spin text-[#FF6B35]" />
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
