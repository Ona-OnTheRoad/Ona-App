import "server-only";

/**
 * Stage 0 inventory buckets for App Router API route.ts files (185 handlers).
 * Stage 2-5 document product domains only; admin/webhook/cron stay residual.
 */
export const OPENAPI_ROUTE_INVENTORY = {
  totals: {
    routeFiles: 185,
    publicProduct: 18,
    authenticatedProduct: 87,
    admin: 65,
    webhook: 1,
    cronSweep: 7,
    internalOps: 7,
  },
  stageTargets: {
    auth: [
      "POST /api/auth/login",
      "POST /api/auth/signup",
      "POST /api/auth/logout",
      "POST /api/auth/otp/send",
      "POST /api/auth/otp/verify",
      "POST /api/auth/otp/profile-verify",
      "POST /api/auth/phone/send-otp",
      "POST /api/auth/phone/verify-otp",
      "POST /api/auth/forgot-password",
      "POST /api/auth/update-password",
      "POST /api/auth/verify-password",
      "POST /api/auth/switch-role",
    ],
    jobs: [
      "GET /api/jobs",
      "POST /api/jobs",
      "GET /api/jobs/{id}",
      "POST /api/jobs/{id}",
      "POST /api/jobs/{id}/transition",
      "POST /api/jobs/{id}/offer",
      "POST /api/jobs/{id}/pay",
      "POST /api/jobs/{id}/location",
      "POST /api/jobs/{id}/rate",
      "POST /api/jobs/{id}/dispute",
      "GET /api/jobs/{id}/callout",
      "GET /api/jobs/pro-incoming-status",
    ],
    payments: [
      "POST /api/payments/init",
      "POST /api/payments/verify",
      "POST /api/payments/release",
      "POST /api/payments/refund",
      "GET /api/payments/banks",
      "POST /api/payments/resolve-account",
      "GET /api/payments/history",
      "POST /api/payments/check-bank-unique",
    ],
    shop: [
      "GET /api/shop/home",
      "GET /api/shop/search",
      "GET /api/shop/products",
      "GET /api/shop/products/{slug}",
      "GET /api/shop/categories",
      "GET /api/shop/filters",
      "GET /api/shop/all-parts",
      "GET /api/shop/delivery/estimate",
      "GET /api/shop/cart",
      "POST /api/shop/cart",
      "POST /api/shop/checkout",
      "GET /api/shop/orders",
      "GET /api/shop/orders/{id}",
    ],
  },
  excludedFromPublicSwagger: {
    admin: "All /api/admin/**",
    webhook: "POST /api/payments/webhooks/flutterwave",
    cronSweep: [
      "/api/jobs/deadline-sweep",
      "/api/jobs/pairing-sweep",
      "/api/jobs/expire-stale",
      "/api/cron/**",
    ],
    internalOps: [
      "/api/health",
      "/api/ops/status",
      "/api/debug/**",
      "/api/log-error",
      "/api/liveness/verify",
      "/api/ship-status",
      "/api/payments/egress-ip",
    ],
  },
  accessPolicy: {
    localNonProduction: "enabled by default",
    production: "disabled unless OPENAPI_DOCS_ENABLED=true",
    explicitDisable: "OPENAPI_DOCS_ENABLED=false",
  },
  library: {
    package: "@asteasolutions/zod-to-openapi",
    version: "^9.1.0",
    openapi: "3.1.0",
    notes: "Zod 4 peer; OpenApiGeneratorV31",
  },
} as const;

export type OpenApiStageDomain = keyof typeof OPENAPI_ROUTE_INVENTORY.stageTargets;
