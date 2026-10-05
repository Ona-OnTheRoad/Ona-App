"use client";

import { useApp } from "@/lib/store";
import { CallbackView } from "./callback-view";
import { usePaymentCallback } from "./use-payment-callback";

export function CallbackInner() {
  const { theme } = useApp();
  const isLight = theme === "light";
  const { ref, jobId, status, message, bookedJobId } = usePaymentCallback();

  return (
    <CallbackView
      isLight={isLight}
      status={status}
      message={message}
      reference={ref}
      jobId={jobId}
      bookedJobId={bookedJobId}
    />
  );
}
