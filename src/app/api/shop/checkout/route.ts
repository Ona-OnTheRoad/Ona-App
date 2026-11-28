import { NextRequest } from "next/server";
import { z } from "zod";
import { apiFail, apiOk } from "@/lib/server/api-json";
import { requireUser } from "@/lib/server/auth-utils";
import { createServiceSupabase } from "@/lib/supabase/server";
import {
  getOrCreateCart,
  validateCartForCheckout,
} from "@/lib/server/shop/cart";
import {
  buildCheckoutToken,
  createOrderFromCart,
} from "@/lib/server/shop/orders";
import { createShopPaymentAndInit } from "@/lib/server/shop/payments";
import { estimateDelivery } from "@/lib/server/shop/delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  accountContext: z.enum(["motorist", "professional"]).optional(),
  addressId: z.string().uuid().optional().nullable(),
  zoneCode: z.string().max(40).optional().nullable(),
  notes: z.string().max(500).optional(),
  email: z.string().email().optional(),
});

/** Create order from cart + init FLW pay-now (no escrow). */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return apiFail("Invalid body", 400, "invalid_body");

    const ctx = parsed.data.accountContext ?? "motorist";
    const cart = await getOrCreateCart(auth.userId, ctx);
    const v = validateCartForCheckout(cart);
    if (!v.ok) return apiFail(v.errors.join("; "), 400, "cart_invalid");

    // Delivery address is mandatory for a payable order.
    if (!parsed.data.addressId) {
      return apiFail("A delivery address is required", 400, "address_required");
    }

    const sb = createServiceSupabase();
    const { data: addr } = await sb
      .from("user_addresses")
      .select("*")
      .eq("id", parsed.data.addressId)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (!addr) {
      return apiFail("Delivery address not found", 404, "address_not_found");
    }

    const shipSnapshot = {
      id: addr.id,
      label: addr.label,
      address: addr.address_text || addr.address || addr.line1,
      lat: addr.lat,
      lng: addr.lng,
    };

    // Delivery fee is ALWAYS server-computed by the delivery engine.
    const delivery = await estimateDelivery({
      addressId: String(addr.id),
      userId: auth.userId,
      zoneCode: parsed.data.zoneCode || addr.delivery_zone_code || null,
      subtotalMinor: cart.subtotalMinor,
    });

    // Remember the zone only when the buyer explicitly picked one this time
    // (never overwrite a saved zone with an implicit default).
    if (parsed.data.zoneCode && delivery.zoneCode === parsed.data.zoneCode) {
      const { error: zErr } = await sb
        .from("user_addresses")
        .update({ delivery_zone_code: delivery.zoneCode })
        .eq("id", addr.id)
        .eq("user_id", auth.userId);
      if (zErr) console.warn("[shop] zone remember failed:", zErr.message);
    }

    const shipToSnapshot = {
      ...shipSnapshot,
      deliveryZoneCode: delivery.zoneCode,
      deliveryZoneName: delivery.zoneName,
      deliveryServiceCode: delivery.serviceCode,
    };

    // Idempotent checkout token: same cart + items + prices + address + zone
    // + fee => same payable order. Anything that changes the deal gets a new one.
    const checkoutToken = buildCheckoutToken({
      cartId: cart.id,
      items: cart.items.map((i) => ({
        variantId: i.variantId,
        qty: i.qty,
        unitPriceMinor: i.unitPriceMinor,
      })),
      addressId: String(addr.id),
      zoneCode: delivery.zoneCode,
      deliveryFeeMinor: delivery.deliveryFeeMinor,
      subtotalMinor: cart.subtotalMinor,
    });

    const order = await createOrderFromCart({
      userId: auth.userId,
      accountContext: ctx,
      cartId: cart.id,
      checkoutToken,
      shipToAddressId: String(addr.id),
      shipToSnapshot: shipToSnapshot,
      delivery: {
        deliveryFeeMinor: delivery.deliveryFeeMinor,
        zoneCode: delivery.zoneCode,
        zoneName: delivery.zoneName,
        serviceCode: delivery.serviceCode,
        etaMinutesMin: delivery.etaMinutesMin,
        etaMinutesMax: delivery.etaMinutesMax,
      },
      notes: parsed.data.notes,
    });

    const email =
      parsed.data.email ||
      auth.email ||
      auth.user.email ||
      `user-${auth.userId.slice(0, 8)}@ona.app`;

    const pay = await createShopPaymentAndInit({
      orderId: order.orderId,
      userId: auth.userId,
      email,
      customerName: auth.user.user_metadata?.full_name || null,
      customerPhone: auth.user.phone || null,
      idempotencyKey: `shop-checkout-${order.orderId}`,
    });

    return apiOk({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      alreadyExists: order.alreadyExists,
      totalMinor: order.totalMinor,
      payment: {
        paymentId: pay.paymentId,
        reference: pay.reference,
        authorizationUrl: pay.authorizationUrl,
        provider: pay.provider,
        amountMinor: pay.amountMinor,
      },
      delivery: {
        deliveryFeeMinor: delivery.deliveryFeeMinor,
        zoneCode: delivery.zoneCode,
        zoneName: delivery.zoneName,
        serviceCode: delivery.serviceCode,
        etaMinutesMin: delivery.etaMinutesMin,
        etaMinutesMax: delivery.etaMinutesMax,
        freeDelivery: delivery.freeDelivery,
      },
      subtotalMinor: cart.subtotalMinor,
    });
  } catch (e) {
    return checkoutErrorResponse(e);
  }
}

/** Known, user-actionable failures get a 4xx; everything else is logged and generic. */
function checkoutErrorResponse(e: unknown) {
  const msg = e instanceof Error ? e.message : "";
  if (msg === "Forbidden") return apiFail("Forbidden", 403, "forbidden");
  if (
    /out of stock|no price|Cart is empty|Only \d+ available|already completed/i.test(
      msg,
    )
  ) {
    return apiFail(msg, 409, "cart_invalid");
  }
  if (/^Order is |cannot pay|Invalid order total/i.test(msg)) {
    return apiFail(msg, 409, "order_not_payable");
  }
  console.error("[shop/checkout] failed:", e);
  return apiFail(
    "We could not start your payment. Please try again.",
    500,
    "SHOP_CHECKOUT_ERROR",
  );
}
