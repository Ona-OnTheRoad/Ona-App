# OpenAPI / Swagger docs for Next.js App Router — review guide

## Goal

Document Ona's existing App Router API (`src/app/api/**/route.ts`) with an OpenAPI 3 spec and Swagger UI, using Zod as the source of truth where practical. Deliver a proper backend-style contract without extracting a separate server. Agreed approach: staged domain coverage, public product APIs first, internal/admin/webhook/cron routes excluded or separately tagged until an explicit later stage.

## Implementation plan (stages)

### Stage 0 — Inventory and access policy

Done: `docs/OPENAPI_INVENTORY.md` + `src/lib/server/openapi/inventory.ts`. Access: local on by default; production off unless `OPENAPI_DOCS_ENABLED=true`. Library: `@asteasolutions/zod-to-openapi` ^9.1.0 → OpenAPI 3.1.

### Stage 1 — Plumbing

Done: `src/lib/server/openapi/**`, `GET /api/openapi`, `GET /api/docs` (Swagger UI via pinned CDN), env gate, envelope components, unit tests.

### Stage 2 — Auth domain

Done: auth path registrations; login + OTP send/verify handlers share schemas from `src/lib/server/openapi/schemas/auth.ts`.

### Stage 3 — Jobs domain

Done: product job paths registered; sweeps/expire-stale omitted from Swagger.

### Stage 4 — Payments domain

Done: product payment paths registered; Flutterwave webhook omitted from interactive docs.

### Stage 5 — Shop domain

Done: home/search/products/cart/checkout/orders and related product paths registered; admin shop omitted.

### Stage 6 — Drift guard and residual policy

Done: `npm run check:openapi-drift` maps registered OpenAPI paths → `route.ts`. Residuals: other authenticated product domains (messages, notifications, profile, express, …) and all admin/webhook/cron/internal buckets.

## Expected change areas

- `src/lib/server/openapi/**`, `src/app/api/openapi/route.ts`, `src/app/api/docs/route.ts`, tests, inventory doc, `.env.example`, package script `check:openapi-drift`.
- Auth login / OTP send / verify import shared OpenAPI Zod schemas (behavior-preserving).

**Protected / do not change:** fees/split, SSPE pairing, job state outcomes, Flutterwave payout semantics, Express pricing, phone-shell UI, demo OTP production defaults.

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON against the reviewed commit. Separate code/test evidence from hosted “docs URL reachable / production gated” evidence.

## Boundaries and limitations

- Not full 185-route coverage; Stage 2–5 product surfaces only (~42 registered paths).
- Swagger Try-it-out for cookie-auth routes is limited; documented via `sessionCookie` scheme note.
- Swagger UI loads `swagger-ui-dist@5.17.14` from unpkg (CDN). Self-host later if offline/dev policy requires it.
- Signup OpenAPI schema documents the core fields; handler may accept additional optional fields (`.passthrough()`).

## Remaining work

Code: optional extract remaining auth/job/payment/shop inline Zod into shared modules; optional expand domains (messages, profile). CDN→self-host if required.

External: hosted enablement smoke (`OPENAPI_DOCS_ENABLED=true` on a non-prod host); confirm production stays gated/off.

## Closeout

Update paired JSON statuses and `remainingWork`. Optional later: link from `docs/BACKEND_ARCHITECTURE.md` if that doc is the ops entrypoint.
