# Issue 7: migration CI, distributed rate limiting and server-only guards

## Goal and agreed plan

Approved in chat on 2026-10-07. Implement three focused changes: apply the full migration chain to an isolated Supabase database in CI and verify critical schema/permissions; require atomic Redis rate limits in deployed environments and test outage behavior; audit client imports, relocate shared helpers/types and guard server entry points. Preserve frozen product rules and protected business logic.

## Expected change areas

`.github/workflows/ci.yml`, migration validation scripts/configuration, `src/lib/server/modules/rate-limit.ts`, existing sensitive rate-limit callers, shared helpers/types, server entry points, test configuration, environment/setup documentation. Historical migration bodies are not rewritten without identifying a fresh-schema failure. Protected files receive boundary markers only where needed; fee, timer and assignment logic remain frozen.

## Reviewer procedure

Use the paired JSON checklist against the reviewed commit. Check atomic counters/expiry, shared worker budgets, production configuration and outage handling, and client import prevention. Run lint, typecheck, tests and production build. Run the fresh database job with schema/role assertions. Record code evidence separately from hosted evidence; unrun checks remain pending.

## Scope update

Production compilation exposed an existing invalid `jobDetail` export from the shop data-source route. Move that helper into a guarded server module, preserving its logic and active endpoint behavior. Include the production build in its verification. Server-importing CLI scripts now require the `react-server` condition.

## Boundaries and limitations

Local memory is allowed only for undeployed development/test when Redis is absent. Deployed Redis failures deny sensitive operations with 503; exhausted budgets return 429. Existing limits and windows are preserved. Provider webhooks and durable reconciliation remain unthrottled by the browser verification limiter. This does not redesign product behavior or close Issues 1–6 residuals.

## Remaining work

Code: full Supabase migration replay/schema-role assertions and formal review against a commit remain pending. Real Redis Lua/concurrency/expiry integration evidence remains pending; mock contract tests do not establish it. Standard Turbopack build was interrupted after stalling in the sandbox; webpack production build passed.

Local evidence: 107 test files / 1,228 tests passed; typecheck passed; lint had 0 errors and 158 existing warnings; production webpack build passed; actual Next negative client-import build passed; diff whitespace check passed. Evidence counts are recorded in the paired JSON checklist. Protected job-store/payout changes are import markers only. See [implementation and rollout](../ISSUE_7_BACKEND_HYGIENE.md).
External: provision isolated Redis per environment, verify deployment behavior and CI run, configure required branch checks and monitoring ownership.

## Closeout

Reviewed commit: pending (working tree based on `800b785331b610c2aeda5d5c224dab842802c69a`, existing `codex/backend-observability-hygiene` branch). This implementation has not been committed or deployed. Update this guide and BACKEND_FIXES_STATUS.md with concrete evidence and residuals.

## CI replay repair

The first PR CI run failed on bootstrap migration 002: a deployment-specific admin profile referenced an absent auth user in the empty database. The seed is now guarded by auth-user existence; existing email-owner promotion is preserved. This historical source correction affects fresh replay only; do not reapply it to hosted migration ledgers. Full replay remains pending the corrected CI run.

The second replay passed bootstrap and failed in migration 020 because the bootstrap notification table lacks group_key. Migration 020 now adds that nullable column before creating its index, matching migration 021. No source migration is skipped.

Replay reached migration 035 and failed installing unused PostGIS due to local role permissions. Audit also found references to nonexistent public.jobs and latitude/longitude columns; application code has no geography-field consumers. Retire that broken draft in favor of indexes on repair_pro_profiles.lat/lng and service_requests.pickup_lat/pickup_lng/pro_lat/pro_lng. The haversine discovery implementation and product radius rules remain unchanged. This corrects fresh source replay; do not replay historical SQL against hosted databases.

Replay then reached migration 036 and found the same CREATE TABLE IF NOT EXISTS upgrade gap in bootstrap admin_actions. Add the newer audit fields explicitly before target indexing, retaining legacy columns and rows. The CI schema assertions now require those fields.
