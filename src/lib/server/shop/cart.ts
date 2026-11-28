import "server-only";
/**
 * Server-authoritative shop cart. Never trust client totals.
 */

import { createServiceSupabase } from "@/lib/supabase/server";
import type { ShopAccountContext } from "@/lib/server/shop/types";

import type { CartLine, CartView } from "@/lib/types/shop-cart";
export type { CartLine, CartView } from "@/lib/types/shop-cart";

type PriceRow = {
  variant_id: string;
  amount_minor: number | string;
  effective_from?: string | null;
  effective_to?: string | null;
  is_active?: boolean | null;
};

/**
 * The price that applies right now per variant: active, already started and
 * not yet ended; newest start wins. (A price scheduled for the future must not
 * be used early.)
 */
export function pickCurrentPrices(
  rows: PriceRow[],
  now: number = Date.now(),
): Map<string, number> {
  const best = new Map<string, { at: number; amount: number }>();
  for (const r of rows) {
    if (r.is_active === false) continue;
    const from = r.effective_from ? Date.parse(r.effective_from) : 0;
    const to = r.effective_to ? Date.parse(r.effective_to) : Infinity;
    if (from > now || to <= now) continue;
    const prev = best.get(String(r.variant_id));
    if (!prev || from > prev.at) {
      best.set(String(r.variant_id), { at: from, amount: Number(r.amount_minor) });
    }
  }
  return new Map([...best].map(([k, v]) => [k, v.amount]));
}

async function currentPrices(
  sb: ReturnType<typeof createServiceSupabase>,
  variantIds: string[],
): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const { data } = await sb
    .from("shop_prices")
    .select("variant_id, amount_minor, effective_from, effective_to, is_active")
    .in("variant_id", variantIds)
    .eq("is_active", true);
  return pickCurrentPrices((data ?? []) as PriceRow[]);
}

async function activePriceMinor(
  sb: ReturnType<typeof createServiceSupabase>,
  variantId: string,
): Promise<number> {
  const prices = await currentPrices(sb, [variantId]);
  return prices.get(variantId) ?? 0;
}

async function availableQty(
  sb: ReturnType<typeof createServiceSupabase>,
  variantId: string,
): Promise<number> {
  const { data } = await sb
    .from("shop_inventory")
    .select("qty_on_hand, qty_reserved")
    .eq("variant_id", variantId);
  let total = 0;
  for (const row of data ?? []) {
    total += Number(row.qty_on_hand ?? 0) - Number(row.qty_reserved ?? 0);
  }
  return Math.max(0, total);
}

export async function getOrCreateCart(
  userId: string,
  accountContext: ShopAccountContext = "motorist",
): Promise<CartView> {
  const sb = createServiceSupabase();
  const { data: existing } = await sb
    .from("shop_carts")
    .select("id, user_id, account_context, currency, status")
    .eq("user_id", userId)
    .eq("account_context", accountContext)
    .eq("status", "open")
    .maybeSingle();

  let cartId = existing?.id as string | undefined;
  if (!cartId) {
    const { data: created, error } = await sb
      .from("shop_carts")
      .insert({
        user_id: userId,
        account_context: accountContext,
        currency: "NGN",
        status: "open",
      })
      .select("id, user_id, account_context, currency")
      .single();
    if (error) throw new Error(error.message);
    cartId = String(created.id);
  }

  return loadCart(String(cartId));
}

export async function loadCart(cartId: string): Promise<CartView> {
  const sb = createServiceSupabase();
  const { data: cart, error } = await sb
    .from("shop_carts")
    .select("*")
    .eq("id", cartId)
    .single();
  if (error || !cart) throw new Error(error?.message || "Cart not found");

  const { data: items } = await sb
    .from("shop_cart_items")
    .select("*")
    .eq("cart_id", cartId);

  // Batched lookups (one query per table, not per cart line).
  const variantIds = [...new Set((items ?? []).map((it) => String(it.variant_id)))];
  const [variantsRes, prices, invRes] = await Promise.all([
    variantIds.length
      ? sb
          .from("shop_product_variants")
          .select("id, product_id, sku, title")
          .in("id", variantIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    currentPrices(sb, variantIds),
    variantIds.length
      ? sb
          .from("shop_inventory")
          .select("variant_id, qty_on_hand, qty_reserved")
          .in("variant_id", variantIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);
  const variantById = new Map(
    (variantsRes.data ?? []).map((v) => [String(v.id), v]),
  );
  const productIds = [
    ...new Set((variantsRes.data ?? []).map((v) => String(v.product_id))),
  ];
  const { data: products } = productIds.length
    ? await sb.from("shop_products").select("id, name, slug").in("id", productIds)
    : { data: [] as Array<Record<string, unknown>> };
  const productById = new Map((products ?? []).map((p) => [String(p.id), p]));
  const availByVariant = new Map<string, number>();
  for (const row of invRes.data ?? []) {
    const k = String(row.variant_id);
    availByVariant.set(
      k,
      (availByVariant.get(k) ?? 0) +
        Number(row.qty_on_hand ?? 0) -
        Number(row.qty_reserved ?? 0),
    );
  }

  const lines: CartLine[] = [];
  for (const it of items ?? []) {
    const variantId = String(it.variant_id);
    const variant = variantById.get(variantId);
    if (!variant) continue;
    const product = productById.get(String(variant.product_id));
    const unit = prices.get(variantId) ?? 0;
    const qty = Number(it.qty);
    const avail = Math.max(0, availByVariant.get(variantId) ?? 0);
    lines.push({
      id: String(it.id),
      variantId,
      productId: String(variant.product_id),
      productName: String(product?.name ?? "Product"),
      productSlug: String(product?.slug ?? ""),
      variantTitle: String(variant.title ?? ""),
      sku: String(variant.sku ?? ""),
      qty,
      unitPriceMinor: unit,
      lineTotalMinor: unit * qty,
      inStock: avail >= qty,
      availableQty: avail,
    });
  }

  const subtotalMinor = lines.reduce((s, l) => s + l.lineTotalMinor, 0);
  return {
    id: String(cart.id),
    userId: String(cart.user_id),
    accountContext: cart.account_context as ShopAccountContext,
    currency: String(cart.currency || "NGN"),
    items: lines,
    subtotalMinor,
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
  };
}

export async function addToCart(opts: {
  userId: string;
  accountContext?: ShopAccountContext;
  variantId: string;
  qty?: number;
}): Promise<CartView> {
  const qty = Math.max(1, Math.min(opts.qty ?? 1, 99));
  const sb = createServiceSupabase();
  const cart = await getOrCreateCart(
    opts.userId,
    opts.accountContext ?? "motorist",
  );

  const avail = await availableQty(sb, opts.variantId);
  if (avail < qty) {
    throw new Error(
      avail <= 0 ? "This item is out of stock" : `Only ${avail} available`,
    );
  }

  const unit = await activePriceMinor(sb, opts.variantId);
  if (unit <= 0) throw new Error("Product has no active price");

  const { data: existing } = await sb
    .from("shop_cart_items")
    .select("id, qty")
    .eq("cart_id", cart.id)
    .eq("variant_id", opts.variantId)
    .maybeSingle();

  if (existing) {
    const nextQty = Number(existing.qty) + qty;
    if (nextQty > avail) {
      throw new Error(`Only ${avail} available`);
    }
    const { error } = await sb
      .from("shop_cart_items")
      .update({
        qty: nextQty,
        unit_price_minor: unit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("shop_cart_items").insert({
      cart_id: cart.id,
      variant_id: opts.variantId,
      qty,
      unit_price_minor: unit,
    });
    if (error) {
      // A concurrent request inserted the same line first (unique cart+variant):
      // add to that line instead, still respecting stock.
      if (error.code !== "23505") throw new Error(error.message);
      const { data: raced } = await sb
        .from("shop_cart_items")
        .select("id, qty")
        .eq("cart_id", cart.id)
        .eq("variant_id", opts.variantId)
        .maybeSingle();
      if (!raced) throw new Error(error.message);
      const nextQty = Number(raced.qty) + qty;
      if (nextQty > avail) throw new Error(`Only ${avail} available`);
      const { error: upErr } = await sb
        .from("shop_cart_items")
        .update({
          qty: nextQty,
          unit_price_minor: unit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", raced.id);
      if (upErr) throw new Error(upErr.message);
    }
  }

  await sb
    .from("shop_carts")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", cart.id);

  return loadCart(cart.id);
}

export async function updateCartItem(opts: {
  userId: string;
  itemId: string;
  qty: number;
}): Promise<CartView> {
  const sb = createServiceSupabase();
  const { data: item } = await sb
    .from("shop_cart_items")
    .select("id, cart_id, variant_id, qty")
    .eq("id", opts.itemId)
    .maybeSingle();
  if (!item) throw new Error("Cart item not found");

  const cart = await loadCart(String(item.cart_id));
  if (cart.userId !== opts.userId) throw new Error("Forbidden");

  if (opts.qty <= 0) {
    await sb.from("shop_cart_items").delete().eq("id", opts.itemId);
    return loadCart(cart.id);
  }

  const avail = await availableQty(sb, String(item.variant_id));
  if (opts.qty > avail) throw new Error(`Only ${avail} available`);

  const unit = await activePriceMinor(sb, String(item.variant_id));
  const { error } = await sb
    .from("shop_cart_items")
    .update({
      qty: opts.qty,
      unit_price_minor: unit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.itemId);
  if (error) throw new Error(error.message);

  return loadCart(cart.id);
}

export async function removeCartItem(opts: {
  userId: string;
  itemId: string;
}): Promise<CartView> {
  return updateCartItem({ ...opts, qty: 0 });
}

export async function clearCart(cartId: string, userId: string): Promise<void> {
  const cart = await loadCart(cartId);
  if (cart.userId !== userId) throw new Error("Forbidden");
  const sb = createServiceSupabase();
  await sb.from("shop_cart_items").delete().eq("cart_id", cartId);
}

export function validateCartForCheckout(cart: CartView): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (cart.items.length === 0) errors.push("Cart is empty");
  for (const line of cart.items) {
    if (!line.inStock) {
      errors.push(`${line.productName} is out of stock`);
    }
    if (line.unitPriceMinor <= 0) {
      errors.push(`${line.productName} has no price`);
    }
  }
  return { ok: errors.length === 0, errors };
}
