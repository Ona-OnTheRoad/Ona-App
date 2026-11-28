import "server-only";
/**
 * Real money-back for shop payments. "Refunded" must only be recorded after
 * the gateway has actually accepted the refund (never a DB label alone).
 */

import {
  attemptFlutterwaveRefund,
  isProductionRuntime,
} from "@/lib/server/payments/providers";

export type GatewayRefundResult =
  | { ok: true; detail: string }
  | { ok: false; message: string };

export async function refundAtGateway(opts: {
  provider: string;
  providerRef: string;
  reason: string;
}): Promise<GatewayRefundResult> {
  if (opts.provider === "mock") {
    if (isProductionRuntime()) {
      return { ok: false, message: "Mock payments cannot be refunded in production" };
    }
    return { ok: true, detail: "mock_refund" };
  }

  if (opts.provider === "flutterwave") {
    const r = await attemptFlutterwaveRefund({
      providerRef: opts.providerRef,
      reason: opts.reason,
    });
    if (r.ok) return { ok: true, detail: r.status };
    return { ok: false, message: r.message || "Flutterwave refused the refund" };
  }

  return {
    ok: false,
    message: `Automatic refunds are not supported for provider "${opts.provider}". Refund manually in the provider dashboard.`,
  };
}
