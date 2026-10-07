# Issue 7 implementation and rollout

## Migration CI

CI runs on pull requests and pushes targeting dev, staging and main. The fresh Supabase migration job gates the build. CLI 2.75.0 starts a disposable PostgreSQL 17 stack with application migrations disabled, then applies all source SQL with migration up. The local administrator grants the postgres migration executor inherited membership in the storage owner role and verifies the complete avatar SQL in a rolled-back transaction before replay. This local fixture preserves table ownership and client-role grants; it is not a hosted provisioning procedure. The setting-based policy bypass and constant-policy probe were insufficient for the actual avatar expressions. All six storage policies are asserted after replay. Hosted PostgreSQL version and migration executor privileges require separate rollout verification.

There are 83 historical SQL files. Their date prefixes repeat, so CLI versions would collide. `scripts/prepare-migration-ci.mjs` copies every file unchanged into a new temporary project with unique timestamps in the same lexical order used by `sync-db-latest.mjs`. The uploaded manifest maps generated versions to original filenames. These synthetic versions are for fresh replay only; do not use them for hosted `db push`, ledger repair or production deployment. Future filenames must retain the repository naming convention until a separate hosted migration-ledger migration is agreed.

`scripts/verify-migration-ci.mjs` checks the complete version manifest, the non-null job version column and enabled trigger, private queue/lease RLS and table privileges, and service-only execution of payment/worker RPCs. A missing migration or failed SQL stops CI. Passing checks do not prove every product rule or every RLS policy.

To reproduce with Docker and Supabase CLI installed, choose a new, disposable directory:

```sh
node scripts/prepare-migration-ci.mjs /private/tmp/ona-migration-ci-example
supabase start --workdir /private/tmp/ona-migration-ci-example
supabase db reset --local --workdir /private/tmp/ona-migration-ci-example
node scripts/verify-migration-ci.mjs /private/tmp/ona-migration-ci-example
supabase stop --no-backup --workdir /private/tmp/ona-migration-ci-example
```

The verifier connects only to `127.0.0.1:54322`. It is intended for the isolated stack above. Full replay is unrun locally because this machine has no Docker or Supabase CLI. Any migration failure found by the first CI run remains required work; the bootstrap admin seed now skips its deployment-specific identity when absent from auth.users. See [Supabase migration workflow](https://supabase.com/docs/guides/local-development/database-migrations).

## Rate limits

Set server-only `UPSTASH_REDIS_REST_URL` (HTTPS) and `UPSTASH_REDIS_REST_TOKEN` in each deployment. Use separate Redis databases for development/preview and production. Never put these values in public variables or evidence files. Redis is required when `NODE_ENV=production` or Vercel environment markers are present.

All seven existing limiter callers now await the shared limiter: login, signup, OTP sends, browser payment verification, bank-account resolution, admin unlock and sensitive admin actions. Existing limits/windows remain. Redis keys hash the caller identity so email, phone and IP values are not stored verbatim. One `EVAL` atomically increments the counter and attaches/repairs its expiry; HTTP status, error payloads, numeric counters and TTL are validated. Requests time out after two seconds. Missing configuration, partial configuration, network failure or malformed replies deny work with 503. Exhausted budgets return 429. Configured Redis failures never fall back to memory. Memory is limited to undeployed development/test with both Redis variables absent.

Completed OTP ledger replays bypass the limit. A new operation checks its budget before claiming the ledger, preserving transient 503/429 errors without storing permanent failures. Concurrent duplicates can consume more than one preflight allowance before the ledger claim; code issuance remains ledger-idempotent. Existing trusted-proxy IP handling is preserved; deployments must sanitize forwarded headers. Provider webhooks and durable payment reconciliation do not use the browser verification limiter.

Local tests cover the HTTP contract, simulated shared budgets/module restart, malformed replies, outages, payment-route short circuits and OTP preflight/replay. They do not execute Lua on real Redis. Before rollout, verify simultaneous requests from multiple deployed workers admit only the configured budget, that expiry restores access, and that outages return 503 without protected effects. Assign ownership for `security.rate_limit.unavailable` monitoring and recovery. See [Upstash REST commands](https://upstash.com/docs/redis/features/restapi) and [EVAL](https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval).

## Server boundaries

Runtime modules under `src/lib/server/` and the service-role Supabase entry point import `server-only`. Protected job/payout files receive the boundary marker only; business logic is unchanged. The browser-used synthetic-account helper and cart DTOs now live in shared modules. The server cart re-exports DTOs for compatibility. Vitest alone aliases the marker to an empty module so server unit tests can run outside React server conditions.

The AST regression check follows browser runtime imports transitively. `npm run check:server-boundaries` separately invokes real Next compilation of a disposable client fixture importing the real service-role entry point and requires a server-only rejection. CI runs this before the application build. Server CLI scripts must use `node --conditions=react-server --import tsx scripts/<script>.mts`; their invocation comments were updated.

The production build also uncovered an existing invalid route export: `jobDetail` was moved from the shop data-source route to `src/lib/server/shop/import-job-detail.ts`. Its body and active endpoints are preserved; no new endpoint was added.

## Verification and release status

Review checklist: [Issue 7 guide](review-guides/issue-7-backend-hygiene.md). The implementation is being committed for a PR targeting `dev`; no reviewed commit or independent review is established. No hosted migration, Redis configuration or deployment was changed. Require the fresh migration, lint/typecheck, tests and build checks in branch protection after a successful CI run. Retain migration replay manifests and record Redis/runtime evidence without credentials or personal data.

## CI replay repair

The first PR CI run failed on bootstrap migration 002: a deployment-specific admin profile referenced an absent auth user in the empty database. The seed is now guarded by auth-user existence; existing email-owner promotion is preserved. This historical source correction affects fresh replay only; do not reapply it to hosted migration ledgers. Full replay remains pending the corrected CI run.

The second replay passed bootstrap and failed in migration 020 because the bootstrap notification table lacks group_key. Migration 020 now adds that nullable column before creating its index, matching migration 021. No source migration is skipped.

Replay reached migration 035 and failed installing unused PostGIS due to local role permissions. Audit also found references to nonexistent public.jobs and latitude/longitude columns; application code has no geography-field consumers. Retire that broken draft in favor of indexes on repair_pro_profiles.lat/lng and service_requests.pickup_lat/pickup_lng/pro_lat/pro_lng. The haversine discovery implementation and product radius rules remain unchanged. This corrects fresh source replay; do not replay historical SQL against hosted databases.

Replay then reached migration 036 and found the same CREATE TABLE IF NOT EXISTS upgrade gap in bootstrap admin_actions. Add the newer audit fields explicitly before target indexing, retaining legacy columns and rows. The CI schema assertions now require those fields.
