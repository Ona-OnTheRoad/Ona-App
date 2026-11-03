import "server-only";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import "@/lib/server/openapi/zod-extend";
import { ApiFailEnvelope, ApiOkEnvelope } from "@/lib/server/openapi/envelopes";
import { OPENAPI_ROUTE_INVENTORY } from "@/lib/server/openapi/inventory";
import { registerAuthPaths } from "@/lib/server/openapi/paths/auth";
import { registerJobsPaths } from "@/lib/server/openapi/paths/jobs";
import { registerPaymentsPaths } from "@/lib/server/openapi/paths/payments";
import { registerShopPaths } from "@/lib/server/openapi/paths/shop";

function buildRegistry(): OpenAPIRegistry {
  const registry = new OpenAPIRegistry();
  registry.register("ApiOkEnvelope", ApiOkEnvelope);
  registry.register("ApiFailEnvelope", ApiFailEnvelope);
  registry.registerComponent("securitySchemes", "sessionCookie", {
    type: "apiKey",
    in: "cookie",
    name: "sb-access-token",
    description:
      "Supabase session cookie (browser). Try-it-out from Swagger may be limited for cookie auth.",
  });
  registerAuthPaths(registry);
  registerJobsPaths(registry);
  registerPaymentsPaths(registry);
  registerShopPaths(registry);
  return registry;
}

/** Build the OpenAPI 3.1 document for enabled docs routes. */
export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(buildRegistry().definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Ona App API",
      version: "1.0.0",
      description: [
        "Product HTTP API for the Ona Next.js App Router.",
        "Stages 2–5 cover auth, jobs, payments, and shop.",
        "Admin, webhooks, cron/sweeps, and internal ops are intentionally excluded from interactive docs.",
        `Inventory: ${OPENAPI_ROUTE_INVENTORY.totals.routeFiles} route files; see x-ona-inventory.`,
      ].join(" "),
    },
    servers: [{ url: "/", description: "Same origin" }],
    tags: [
      { name: "auth", description: "Signup, login, OTP, password, role switch" },
      { name: "jobs", description: "Service requests (product surface; sweeps excluded)" },
      { name: "payments", description: "Job escrow payments (Flutterwave webhook excluded)" },
      { name: "shop", description: "Retail catalog, cart, checkout, orders" },
    ],
  });
}

/** Paths registered in the OpenAPI document (OpenAPI form, e.g. /api/jobs/{id}). */
export function listRegisteredOpenApiPaths(): string[] {
  const doc = buildOpenApiDocument() as {
    paths?: Record<string, unknown>;
  };
  return Object.keys(doc.paths ?? {}).sort();
}
