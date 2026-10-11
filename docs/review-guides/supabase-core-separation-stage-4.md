# Supabase core separation — Stage 4 review guide

## Goal

Stage 4 of the Supabase Decoupling Assessment's six-stage sequence: "extract
server persistence by domain" — put jobs, payments, pairing, shop and
identity behind defined interfaces instead of exposing Supabase-specific
clients and table mappings to business logic. The domain folders
`src/lib/server/{jobs,payments,pairing,shop,identity}` already exist; this
formalizes the boundary rather than building it from nothing. Parent plan:
`reports/Ona-Scope-2-Core-Separation.html`. Parent tracking doc for Stages
1-3 (already merged to `dev`): `docs/review-guides/supabase-core-separation.md`.

## Scope research (2026-10-10)

Parallel research across all 5 named domains found 56 non-test files, ~32
touching Supabase directly, with very different starting points per domain —
too large for one slice, so Stage 4 is being done as a series of slices, one
PR per slice, same discipline as Stages 2-3.

| Domain | Files | Direct-Supabase files | Existing boundary |
|---|---|---|---|
| jobs | 20 | 10 | Yes — `job-store/index.ts` barrel; 3 route handlers (`surface`, `dispatch-scheduled`, `expire-stale`'s zombie-reset) still bypass it |
| payments | 10 | 5 | Yes — `confirmation-store.ts`, `durable-processing.ts`, `payout-ledger.ts`, mostly `escrow-store.ts`; 3 route handlers (`init`, `refund`, `check-bank-unique`) and `payout-settlement.ts` bypassed it (fixed in slice 1, see below) |
| pairing | 1 (`pairing-engine.ts`, 1459 lines) | 1 (100% mixed) | None. Also architecturally separate from jobs' job-store even though both write `service_requests` independently — two uncoordinated code paths on one table today |
| shop | 21 | 13 | Almost none (only `data-sources.ts` is a clean adapter). Several admin routes (analytics, deliveries, couriers) have business logic with no `src/lib/server/shop` counterpart at all |
| identity | 3 | 2 (`identity-sync.ts`, `dual-t2-mirror.ts`; `protect-approval.ts` is already clean) | Partial — the real problem is ~15 caller routes (signup, login, switch-role, profile/update, admin/*) that duplicate direct profile/motorist/pro-profile queries instead of centralizing through `identity-sync.ts` |

Also flagged, same problem but outside Stage 4's named scope: `merit/merit-engine.ts`
and 7 other domain folders under `src/lib/server/` (`callout`, `express`,
`modules`, `push`, `reviews`, `security`) exhibit the identical
direct-Supabase-in-business-logic pattern.

## Slice 1: payments route handlers (done, commit `04bab32`)

Lowest-risk slice — payments already has real adapters, so this is about
routing 3 handlers through them, not building a new interface.

**Fixed:**
- New `src/lib/server/payments/bank-lookup.ts` adapter: `loadMotoristBankCode`,
  `loadProBankCode`, `loadMotoristBankDetails`, `loadProBankDetails`,
  `loadIdentityCheck`, `isBankAccountTaken`.
- `src/app/api/payments/init/route.ts` — bank-code lookup and self-payment
  identity check now call the adapter instead of querying
  `motorist_profiles`/`repair_pro_profiles`/`profiles` directly.
- `src/app/api/payments/refund/route.ts` — local `loadMotoristBank` deleted,
  replaced with `loadMotoristBankDetails`.
- `src/app/api/payments/check-bank-unique/route.ts` — inline 3-table matcher
  replaced with `isBankAccountTaken`.
- `src/lib/server/payments/payout-settlement.ts` — local `loadProBank`
  deleted, replaced with `loadProBankDetails`.

No behavior change: same queries, same tables, same null-on-error fallback.
New tests added for all of the above (none existed for these 3 routes
before).

**Explicitly deferred, not fixed in this slice:**
- `payout-settlement.ts`'s `finalizeJobReleasedAfterPayout` writes directly
  to `service_requests` with job-version optimistic concurrency — a
  **jobs**-domain concern, not payments. Needs a job-store function; bigger,
  cross-domain decision for a later slice.
- `src/app/api/profile/update/route.ts`'s `isBankAccountTakenByOtherUser` is
  a near-duplicate of the old check-bank-unique matcher — but subtly
  different (it never checked `payout_methods`). Worth consolidating onto
  the new `isBankAccountTaken` later; left alone here since `profile/update`
  is outside "payments route handlers" scope. **This is itself a latent
  inconsistency** (two bank-uniqueness checks that don't agree) worth fixing
  regardless of Stage 4.

## Slice 2: jobs route handlers (done, commit `386a3e7`)

The 3 jobs route handlers that bypassed `job-store` (`surface`,
`dispatch-scheduled`, `expire-stale`'s zombie-reset).

**Key fact confirmed against `supabase/migrations/20261007_079_job_version_cas.sql`:**
`job_version` is bumped by a `BEFORE UPDATE` trigger on *every* write to a
`service_requests` row, unconditionally. A bare `job_version` guard is
therefore exactly as strong as the original compound guards (adding
`pairing_stage`/`flow_status` checks) — any concurrent write already bumps
`job_version`. Decided to keep the original guards verbatim anyway (not a
"simplification") rather than lean on this equivalence, matching
`job-store/dispatch.ts`'s own existing convention (it already has ~8
functions doing this exact raw-guarded-update shape).

**Fixed:**
- New `src/lib/server/jobs/job-store/dispatch.ts` functions:
  `armSurfacePairingDeadline`, `dispatchScheduledSecondPro` — verbatim
  relocations of the two routes' raw `.update(...).eq(...)` calls, returning
  a discriminated `{ ok, conflict, message }` result (not `persist()`'s
  thrown error) so each route's existing inline 409/500 branching is
  unchanged.
- New `src/lib/server/jobs/job-store/expiry.ts` function
  `resetZombieFlowStatuses` — verbatim relocation of the bulk hygiene sweep.
- Deliberately did **not** route these through the generic `persist()`
  helper: verifying `jobToDbPatch` covers every field these updates touch
  would be extra verification surface for no benefit, and a silent gap
  there would be a real regression (a dropped column on write).
- All 3 routes rewired to call the new functions instead of
  `createServiceSupabase()` directly.
- Found and fixed a collateral break: an existing test
  (`src/app/api/__tests__/second-pro-routes.test.ts`) mocked
  `@/lib/server/jobs/job-store` without the 2 new exports, so after the
  rewire 2 of its tests failed (the route called an `undefined` mock
  function). Updated the mock and rewrote the 3 affected tests to assert on
  `dispatchScheduledSecondPro`'s mocked result instead of a raw Supabase
  update payload that no longer exists at the route level.
- New tests: `job-store/__tests__/dispatch.test.ts` (8),
  `job-store/__tests__/expiry.test.ts` (4),
  `jobs/[id]/surface/__tests__/route.test.ts` (7 — this route had zero
  coverage before). Full suite: 1,304 tests / 120 files.

## Pairing: deliberately skipped

Before touching `pairing-engine.ts`, read its original design spec
(`docs/SSPE_REFACTOR_PLAN.md` §6) and the mandatory
`docs/ANTI_REGRESSION.md`. This file is not accidental tech debt — it was
deliberately designed as a standalone, idempotent, advisory-locked module
where every function does an atomic `UPDATE ... WHERE pairing_stage =
expected` in one round-trip. Splitting the read-check from the write across
a "business logic" file and an "adapter" file (the slice-1/2 pattern) would
reopen the exact TOCTOU race that single-statement `UPDATE` was built to
close.

It also already satisfies Stage 4's spirit better than shop or identity do:
every pairing/dispatch mutation is concentrated in one file behind named,
documented, idempotent exported functions. The real gap (inline
`createServiceSupabase()` per function, not imported from a separate
adapter) is much smaller than shop's (zero concentration at all) or
identity's (logic duplicated across ~15 routes).

**Decision (2026-10-10):** skip a pairing refactor for Stage 4; spend the
risk budget on shop next. Not independently verified: whether
`pairing-engine.ts` and `job-store/dispatch.ts`'s `assignNextPro`/
`rerouteDeclinedJob` ever operate on the same job concurrently, or are
mutually exclusive by job state (SSPE vs. legacy dispatch) — tracked as
open remaining work, separate from the interface question.

## Slice 3: shop admin routes with no domain-folder home (done, commit `032bdf1`)

Shop is 21 files, no boundary; too large for one slice. This first shop
sub-slice targets the cleanest, most unambiguous gap: 4 admin route
handlers had real business logic + direct Supabase calls with **no
corresponding file in `src/lib/server/shop/` at all** — the boundary
wasn't bypassed here, it was never built.

**Ruled out first:** `checkout/route.ts` and `delivery/estimate/route.ts`
both inline a `user_addresses` lookup — looked like a clean slice-1-style
duplication fix, but `user_addresses` is also used by
`/api/addresses/route.ts` and `identity-sync.ts`. It's a cross-cutting
concern shop doesn't own; fixing it would invent an implicit 6th domain,
out of scope here.

**Fixed:**
- `GET /api/admin/shop/analytics` → new `admin-analytics.ts`
  (`getShopDemandAnalytics`).
- `GET|POST|PATCH /api/admin/shop/couriers` → new `admin-couriers.ts`
  (`listCourierProviders`, `upsertCourierProvider`,
  `patchCourierProvider`).
- `PATCH /api/admin/shop/deliveries` → new `admin-deliveries.ts`
  (`upsertDeliveryStatus`), including the `shop_orders` status-mirror
  logic and the `shop_order_events`/`shop_audit_logs` writes.
- `POST /api/shop/product-requests` → new `product-requests.ts`
  (`recordProductRequest`, `ProductRequestsNotMigratedError`).

**Design grounded in existing conventions, not invented:**
`shop_audit_logs` and `shop_order_events` inserts moved *into* the domain
functions, because `admin-catalog.ts`/`orders.ts`/`payments.ts` already do
this at every write. `logAdminAction` (cross-cutting admin-identity audit,
needs the route's `requireAdmin()` result) and
`requireAdmin()`/`isSupabaseAdminConfigured()` stayed in the routes —
matches every slice so far: routes own auth, domain modules own tables.

New tests: `shop/__tests__/{admin-analytics,admin-couriers,admin-deliveries,
product-requests}.test.ts` (20) and 4 new route test files (19). None of
these 4 routes had coverage before. Full suite: 1,343 tests / 128 files.

## Slice 4: shop scope survey + all-parts.ts split (done, commit `ed07d76`)

Before touching any of shop's other direct-Supabase files, surveyed them
first rather than assuming the original file count meant they all needed
splitting. Per the user's explicit instruction, `cart.ts`, `orders.ts`,
`admin-catalog.ts` and `payments.ts` were excluded up front — they sit next
to (or directly contain, for `orders.ts`) the atomic inventory-reservation
RPC (`ona_shop_reserve`) and the payment-verification/refund-on-failure
sequence, the same category of risk that got pairing skipped.

**Finding: most of the rest already satisfy Stage 4's spirit.**
`garage.ts`, `job-recommendations.ts`, `delivery.ts` (pure
`computeDeliveryFee` already extracted), `search.ts` (pure logic already
lives in `intent.ts`/`normalize.ts`; `searchShop` is thin orchestration),
and `import-engine.ts` (doesn't even self-instantiate a client — takes one
as a parameter) are already thin, single-purpose domain modules. This is
the same acceptable shape job-store's own "store" sublayer
(`cache.ts`/`reads.ts`) has — Stage 4 never asked for *zero* direct
Supabase calls in domain files, only that business-logic callers (routes,
other domains) not touch tables directly. Forcing a split here would add
file-hopping indirection with no real benefit.

**One file flagged but deliberately left alone:** `catalog.ts`'s
`listProducts` (424 lines) does mix real filtering/fitment/stock logic
with queries — but it's the single most central function in shop (search,
all-parts, job-recommendations, home sections all call it). That
complexity + blast-radius combination makes it a bad fit for a quick
slice; it needs its own dedicated pass with characterization tests, not a
mechanical split alongside everything else.

**One genuine, bounded, safe candidate: `all-parts.ts`'s
`getAllPartsForVehicle`** (~125 lines, single caller, read-only, no
reservation/payment adjacency). Extracted 4 pure functions verbatim from
the existing logic — `enrichProductWithFitment`,
`compareEnrichedByFitmentThenPrice`, `buildCategoryProductCounts`,
`rollupCategoryTree` — with no behavior change (confirmed: full suite green
before and after, same queries, same field computations). New tests:
`shop/__tests__/all-parts.test.ts` (11 — unit tests per pure function plus
2 integration tests against the orchestrator). Full suite: 1,354 tests /
129 files.

## Slice 5 first batch: login and switch-role (implemented and locally verified)

[Inventory and review evidence](supabase-core-separation-stage-4-slice-5.md) records the broader identity dependency set. The user approved login/switch-role as the first batch. Both routes now delegate identity persistence to focused server-only modules: `login-identity.ts` / `login-profile.ts` and `switch-identity.ts` / `switch-profile.ts`, each under 300 lines. Auth and HTTP mapping stay in the routes. The existing queries, response mapping, role guards, profile repair, migration fallback, pro Away, bank sync/reload and differing error semantics are preserved.

32 characterization tests passed against the original routes and after extraction; 9 additional persistence/projection cases pass. Full local suite: 1,395 tests / 133 files; typecheck passes; lint 0 errors / 160 warnings with none in changed files. No migration, environment or protected-file change. Reviewed commit, independent review and hosted smoke remain pending. The rest of the identity inventory is not implemented by this first batch.

## Slice 5 batch 2: own-profile and role-flags (implemented and locally verified)

User approved this read-only batch after batch 1 was committed as `a3dd798`. GET `/api/profile` and GET `/api/account/role-flags` now delegate to server-only `own-profile.ts` and `role-flags.ts` (211 / 41 lines). Session-only authorization, HTTP/error responses, projections, bank/primary-role/identity fallbacks and guarantor mapping are preserved. All six query sites, including guarantor, are select-only and scoped to the session caller. No schema/config/protected changes.

26 route tests (17 new) passed before and after extraction. Full suite: 1,412 tests / 133 files; typecheck passes; lint 0 errors / 160 warnings, none in changed files; diff check passes. [Detailed criteria and evidence](supabase-core-separation-stage-4-slice-5.md). Independent review of the exact commit and hosted two-account/both-role smoke remain pending. Later identity batches remain deferred.

## Slice 5 batch 3: admin user list (implemented and locally verified)

Approved scope: GET `/api/admin/users` only, baseline `13e0c6f`. New server-only `admin-users.ts` owns five identity read sites and result mapping (156 lines); route retains admin/config checks, query parsing and HTTP/error responses. Preserves general 300-row and special 400-pro listings, dual-role inclusion, different search paths, projections, missing-profile defaults and secondary-error handling. No writes/schema/config/protected changes.

19 new route tests passed before and after extraction; full suite 1,431 tests / 134 files and typecheck pass. Lint passes: 0 errors / 160 warnings, none in changed files; diff check passes. Independent review of exact commit and hosted listing/search/filter smoke remain pending. [Detailed criteria/evidence](supabase-core-separation-stage-4-slice-5.md). Later batches excluded.

## Slice 5 batch 4: admin detail identity reads (implemented and locally verified)

Approved identity-only portion of GET `/api/admin/users/[id]`, baseline `40e0fa1`. New server-only `admin-detail.ts` (51 lines) internally owns its client and exposes typed shared-profile, nullable customer/pro-profile and identity-status operations. Route retains config/admin/HTTP guards and all four existing history queries. Three identity query chains and four history query chains preserve their original projections/filters/terminals; secondary reads remain concurrent. No writes/schema/config/protected changes.

14 new characterization tests passed before/after extraction; one additional client-boundary test passes. Full suite: 1,446 tests / 135 files; typecheck; lint 0 errors / 160 existing warnings; diff check. [Detailed evidence and limitations](supabase-core-separation-stage-4-slice-5.md). Independent review of exact commit and hosted admin-detail smoke pending. The route's history persistence boundary is explicitly not closed by this batch.

## Remaining slices

- **catalog.ts's `listProducts`:** needs its own dedicated slice with
  characterization tests first, not a mechanical split bundled with
  anything else.
- Still unresolved: where the `checkout`/`delivery-estimate`
  `user_addresses` duplication should actually live, since it isn't shop's.
- **Identity (slice 5):** [caller inventory and proposed scope](supabase-core-separation-stage-4-slice-5.md) records 53 API routes / 237 literal identity-table call sites. The earlier ~15 estimate was incomplete. Approved first batch (login and switch-role, commit `a3dd798`) and batch 2 (own-profile/role-flags, local) are implemented; independent review and hosted checks remain pending. Later batches require scope agreement. Use focused identity interfaces rather than expanding `identity-sync.ts` into a larger monolith.

## Reviewer procedure

Same as Stages 1-3: inspect each requirement below against the reviewed
commit; confirm no behavior change per slice (same queries/tables/guards/
fallback semantics, just relocated); record code evidence separately from
hosted evidence; never mark an unrun check passed.

## Exit criteria (from the parent plan, Stage 4 subset)

Business services in the agreed scope use defined interfaces rather than
Supabase SDK types or clients directly — verified via manual import audit of
`src/lib/server/{jobs,payments,pairing,shop,identity}`. This guide tracks
per-slice progress toward that, not a one-shot pass/fail.

## Closeout

Reviewed commit: slices 1-3 (`04bab32`, `386a3e7`, `032bdf1`), all pushed to
`codex/supabase-core-separation-stage-4`. Slice 4 (all-parts.ts split)
committed as `ed07d76`; independent review remains pending. Pairing deliberately
skipped (no commit). Slice 5 first batch is implemented and locally verified. Independent review and hosted verification are
pending for all of Stage 4, same as Stages 2-3.

## Admin user-detail history follow-up (implemented locally)

Approved on 2026-10-11, baseline `b3c71fd`: the four jobs/bookings/payments/reviews queries now live in a 58-line server-only admin reporting reader with an internally owned client. The route retains its HTTP/admin/config/shared-profile guards and seven-way parallel loading, with no direct table/client calls. Query projections, both-role filters, descending order, limits and existing error/default behaviour are preserved.

24 characterization tests passed before/after extraction; full suite 1,455 tests / 135 files and typecheck pass. Lint: 0 errors / 160 existing warnings; diff check passes. [Detailed guide and final gate results](supabase-core-separation-admin-user-history.md). Exact-commit independent review and hosted smoke remain pending. Later identity batches and other admin/Care routes remain deferred. Returned history query errors can still appear as empty histories; changing that behaviour is outside this extraction.
