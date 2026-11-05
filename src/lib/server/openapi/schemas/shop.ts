import "server-only";
import { z } from "@/lib/server/openapi/zod-extend";

export const shopSlugParamsSchema = z
  .object({
    slug: z.string().min(1),
  })
  .openapi("ShopSlugParams");

export const shopOrderIdParamsSchema = z
  .object({
    id: z.string().min(1),
  })
  .openapi("ShopOrderIdParams");

export const shopCartBodySchema = z
  .object({
    productId: z.string().optional(),
    variantId: z.string().optional(),
    quantity: z.number().int().min(0).optional(),
    action: z.string().optional(),
  })
  .passthrough()
  .openapi("ShopCartBody");

export const shopCheckoutBodySchema = z
  .object({
    addressId: z.string().optional(),
    deliveryOption: z.string().optional(),
  })
  .passthrough()
  .openapi("ShopCheckoutBody");

export const shopSearchQuerySchema = z
  .object({
    q: z.string().optional(),
    trade: z.string().optional(),
    page: z.string().optional(),
  })
  .passthrough()
  .openapi("ShopSearchQuery");
