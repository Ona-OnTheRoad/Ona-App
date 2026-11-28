import "server-only";
/**
 * Shop pay-now via Flutterwave NEVER uses job escrow store.
 */

import { createServiceSupabase } from "@/lib/supabase/server";
import {
  initCharge,
  resolveProvider,
  verifyCharge,
} from "@/lib/server/payments/providers";
import type { AppCurrency } from "@/lib/pricing";
import {
  markShopOrderPaid,
  refundCapturedPayment,
} from "@/lib/server/shop/orders";

export async function createShopPaymentAndInit(opts: {
  orderId: string;
  userId: string;
  email: string;
  customerName?: string | null;
  customerPhone?: string | null;
  idempotencyKey?: string;
}): Promise<{
  paymentId: string;
  reference: string;
  authorizationUrl: string;
  provider: string;
  amountMinor: number;
}> {
  const sb = createServiceSupabase();
  const { data: order } = await sb
    .from("shop_orders")
    .select("*")
    .eq("id", opts.orderId)
    .eq("user_id", opts.userId)
    .maybeSingle();
  if (!order) throw new Error("Order not found");
  if (order.status !== "pending_payment") {
    throw new Error(`Order is ${order.status}, cannot pay`);
  }

  const amountMinor = Number(order.total_minor);
  if (amountMinor <= 0) throw new Error("Invalid order total");

  // Idempotent: reuse a still-usable pending payment for this order. A payment
  // that already failed/cancelled (or has no checkout link) is never reused,
  // and its idempotency key is retired so a fresh attempt can be created.
  let idempotencyKey = opts.idempotencyKey;
  if (idempotencyKey) {
    const { data: existing } = await sb
      .from("shop_payments")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing) {
      const url = String(
        (existing.raw_init as { authorizationUrl?: string } | null)
          ?.authorizationUrl || "",
      );
      const usable =
        existing.provider_ref &&
        existing.status === "pending" &&
        (url || existing.provider === "mock");
      if (usable) {
        return {
          paymentId: String(existing.id),
          reference: String(existing.provider_ref),
          authorizationUrl: url,
          provider: String(existing.provider),
          amountMinor: Number(existing.amount_minor),
        };
      }
      if (existing.status === "pending") {
        await sb
          .from("shop_payments")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", existing.id)
          .eq("status", "pending");
      }
      idempotencyKey = `${idempotencyKey}:${Date.now().toString(36)}`;
    }
  }

  const reference = `shop_${opts.orderId.slice(0, 8)}_${Date.now().toString(36)}`;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  const callbackUrl = `${appUrl}/shop/checkout/callback?ref=${encodeURIComponent(
    reference,
  )}&order=${encodeURIComponent(opts.orderId)}`;

  const provider = resolveProvider(null);
  const currency = (order.currency || "NGN") as AppCurrency;

  const init = await initCharge({
    amountMinor,
    currency,
    email: opts.email,
    customerName: opts.customerName,
    customerPhone: opts.customerPhone,
    reference,
    callbackUrl,
    metadata: {
      kind: "ona_shop",
      orderId: opts.orderId,
      orderNumber: order.order_number,
      userId: opts.userId,
      // Explicitly no job escrow fields
      shop: true,
    },
    // No pro subaccount split for retail
    proSubaccountId: null,
  });

  const { data: payment, error } = await sb
    .from("shop_payments")
    .insert({
      order_id: opts.orderId,
      user_id: opts.userId,
      provider: init.provider,
      provider_ref: init.reference,
      amount_minor: amountMinor,
      currency,
      status: "pending",
      raw_init: init,
      idempotency_key: idempotencyKey || null,
    })
    .select("id")
    .single();
  if (error || !payment)
    throw new Error(error?.message || "Payment row failed");

  await sb.from("shop_order_events").insert({
    order_id: opts.orderId,
    event_type: "payment_init",
    payload: { paymentId: payment.id, reference: init.reference, provider },
    actor_id: opts.userId,
  });

  return {
    paymentId: String(payment.id),
    reference: init.reference,
    authorizationUrl: init.authorizationUrl,
    provider: init.provider,
    amountMinor,
  };
}

export type VerifyShopPaymentResult = {
  success: boolean;
  orderId: string | null;
  alreadyPaid?: boolean;
  /** The gateway has not confirmed or rejected the charge yet. Safe to retry. */
  pending?: boolean;
  /** Money was taken but the order could not be fulfilled; it was refunded. */
  refunded?: boolean;
  /** Money was taken, could not be fulfilled, and the refund needs ops action. */
  refundPending?: boolean;
  message?: string;
};

/**
 * True only when the gateway says the charge definitively failed. A charge the
 * customer has not finished (or that the gateway cannot find yet) is
 * *pending*, never "failed", so a later successful payment is still accepted.
 */
export function isDefinitiveChargeFailure(raw: unknown): boolean {
  const data = (raw as { data?: { status?: string } } | null)?.data;
  const status = String(data?.status ?? "").toLowerCase();
  return status === "failed" || status === "cancelled" || status === "reversed";
}

export async function verifyShopPayment(opts: {
  reference: string;
  userId?: string;
}): Promise<VerifyShopPaymentResult> {
  const sb = createServiceSupabase();
  const { data: payment } = await sb
    .from("shop_payments")
    .select("*")
    .eq("provider_ref", opts.reference)
    .maybeSingle();
  if (!payment) throw new Error("Shop payment not found");
  if (opts.userId && payment.user_id !== opts.userId) {
    throw new Error("Forbidden");
  }
  const orderId = String(payment.order_id);

  if (payment.status === "refunded") {
    return {
      success: false,
      orderId,
      refunded: true,
      message: "This payment was refunded.",
    };
  }

  // Already confirmed earlier: just make sure the order really finished
  // (covers a crash between "payment succeeded" and "order paid").
  if (payment.status === "succeeded") {
    return finalizeCapturedPayment({
      orderId,
      paymentId: String(payment.id),
      reference: opts.reference,
      provider: String(payment.provider),
    });
  }

  const verified = await verifyCharge(
    opts.reference,
    payment.provider as "flutterwave" | "paystack" | "mock",
  );

  if (!verified.success) {
    if (isDefinitiveChargeFailure(verified.raw)) {
      await sb
        .from("shop_payments")
        .update({
          status: "failed",
          raw_verify: verified.raw ?? verified,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id)
        .eq("status", "pending");
      return { success: false, orderId, message: "Payment was not successful." };
    }
    // Not finished / not found yet: leave the payment pending.
    return {
      success: false,
      orderId,
      pending: true,
      message: "We have not received confirmation of this payment yet.",
    };
  }

  // Amount check (tolerance 1 minor unit). Mock verify carries no real amount,
  // so the recorded payment amount is authoritative for the mock provider.
  const amountOk =
    payment.provider === "mock"
      ? true
      : Math.abs(Number(verified.amountMinor) - Number(payment.amount_minor)) <=
        1;
  if (!amountOk) {
    await sb
      .from("shop_payments")
      .update({
        status: "failed",
        raw_verify: {
          ...((verified.raw as object) || {}),
          amountMismatch: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("status", "pending");
    throw new Error("Payment amount mismatch");
  }

  // Atomic claim: only the call that flips pending/failed -> succeeded records
  // the provider payload. Everyone else falls through to the (idempotent,
  // row-locked) finalize step, so concurrent confirmations are safe.
  await sb
    .from("shop_payments")
    .update({
      status: "succeeded",
      paid_at: verified.paidAt || new Date().toISOString(),
      raw_verify: verified.raw ?? verified,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .neq("status", "succeeded")
    .neq("status", "refunded");

  return finalizeCapturedPayment({
    orderId,
    paymentId: String(payment.id),
    reference: opts.reference,
    provider: String(payment.provider),
  });
}

/**
 * The money is captured. Finish the order (atomic, idempotent). If the order
 * can no longer be fulfilled (stock ran out, or it was cancelled while the
 * customer was paying), give the money back for real.
 */
async function finalizeCapturedPayment(opts: {
  orderId: string;
  paymentId: string;
  reference: string;
  provider: string;
}): Promise<VerifyShopPaymentResult> {
  const outcome = await markShopOrderPaid({
    orderId: opts.orderId,
    paymentId: opts.paymentId,
  });

  if (outcome === "paid") return { success: true, orderId: opts.orderId };
  if (outcome === "already_paid") {
    return { success: true, orderId: opts.orderId, alreadyPaid: true };
  }
  if (outcome === "not_found") throw new Error("Order not found");

  const reason =
    outcome === "insufficient_stock" ? "stock_unavailable" : "order_not_payable";
  const refund = await refundCapturedPayment({
    orderId: opts.orderId,
    reason,
  });
  const why =
    outcome === "insufficient_stock"
      ? "an item went out of stock"
      : "the order was cancelled before payment completed";
  if (refund.refunded) {
    return {
      success: false,
      orderId: opts.orderId,
      refunded: true,
      message: `Your payment was received but ${why}. It has been refunded to your original payment method.`,
    };
  }
  return {
    success: false,
    orderId: opts.orderId,
    refundPending: true,
    message: `Your payment was received but ${why}. Your refund is being processed by our team - you do not need to pay again.`,
  };
}
