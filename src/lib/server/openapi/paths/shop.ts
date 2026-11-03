import "server-only";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerProductPath } from "@/lib/server/openapi/register-helpers";
import {
  shopCartBodySchema,
  shopCheckoutBodySchema,
  shopOrderIdParamsSchema,
  shopSearchQuerySchema,
  shopSlugParamsSchema,
} from "@/lib/server/openapi/schemas/shop";

const tag = ["shop"];

export function registerShopPaths(registry: OpenAPIRegistry) {
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/home",
    tags: tag,
    summary: "Shop home sections",
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/search",
    tags: tag,
    summary: "Search shop catalog",
    query: shopSearchQuerySchema,
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/products",
    tags: tag,
    summary: "List products",
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/products/{slug}",
    tags: tag,
    summary: "Product detail by slug",
    params: shopSlugParamsSchema,
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/categories",
    tags: tag,
    summary: "Shop categories",
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/filters",
    tags: tag,
    summary: "Shop filter facets",
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/all-parts",
    tags: tag,
    summary: "Browse all parts",
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/delivery/estimate",
    tags: tag,
    summary: "Delivery estimate",
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/cart",
    tags: tag,
    summary: "Get cart",
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/shop/cart",
    tags: tag,
    summary: "Mutate cart",
    body: shopCartBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/shop/checkout",
    tags: tag,
    summary: "Checkout cart",
    body: shopCheckoutBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/orders",
    tags: tag,
    summary: "List shop orders",
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/shop/orders/{id}",
    tags: tag,
    summary: "Shop order detail",
    params: shopOrderIdParamsSchema,
    authenticated: true,
  });
}