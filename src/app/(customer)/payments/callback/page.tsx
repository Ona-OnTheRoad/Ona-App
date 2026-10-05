"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CallbackInner } from "@/components/payments/callback/callback-inner";

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#c8c9cd]">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
