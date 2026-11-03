# OpenAPI route inventory (Stage 0)

Snapshot of `src/app/api/**/route.ts` for the OpenAPI / Swagger effort. Counts are approximate as of implementation; regenerate by recounting `route.ts` files if the tree changes.

## Totals

| Bucket | Count |
|--------|------:|
| Public product | 18 |
| Authenticated product | 87 |
| Admin | 65 |
| Webhook | 1 |
| Cron / sweep | 7 |
| Internal / ops | 7 |
| **All route files** | **185** |

## Access policy

| Environment | Docs (`/api/openapi`, `/api/docs`) |
|-------------|-----------------------------------|
| Local / non-production | On by default |
| Production | Off unless `OPENAPI_DOCS_ENABLED=true` |
| Any | Off if `OPENAPI_DOCS_ENABLED=false` |

## Library

- `@asteasolutions/zod-to-openapi` ^9.1.0 (Zod 4)
- OpenAPI **3.1** via `OpenApiGeneratorV31`

## Stage domain targets (documented in Swagger)

See `OPENAPI_ROUTE_INVENTORY.stageTargets` in `src/lib/server/openapi/inventory.ts` for auth, jobs, payments, and shop paths.

## Excluded from public Swagger (by design)

- All `/api/admin/**`
- `POST /api/payments/webhooks/flutterwave`
- Job sweeps / expire-stale and `/api/cron/**`
- Health, ops, debug, liveness, log-error, ship-status, payments egress-ip

## Residuals

Authenticated product routes outside auth/jobs/payments/shop stage lists (messages, notifications, profile, express, etc.) remain undocumented until a later stage. Drift guard only asserts that **registered** OpenAPI paths have a matching `route.ts`.
