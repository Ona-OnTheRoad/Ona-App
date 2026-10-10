# Stage 4 Slice 5 — identity caller inventory and proposed review guide

## Goal

Inventory identity persistence callers before approving implementation. Preserve existing behaviour while moving agreed callers behind focused identity operations. Parent: [Stage 4 guide](supabase-core-separation-stage-4.md).

Inventory date: 2026-10-10. Source commit: `ed07d76d8518da279e4553dfb00c0e09841a4976`. The user approved the first implementation batch (login and switch-role) on 2026-10-10 after reviewing the inventory and proposed criteria. Broader batches remain proposed. The inventory below is a historical snapshot of the source commit.

## Inventory method and limits

Static scan of non-test TypeScript under `src/app/api` and `src/lib/server` for literal `.from(...)` calls to `profiles`, `motorist_profiles`, `repair_pro_profiles`, `user_roles`, `payout_methods`, `identity_sync_log`, and `identity_merges`, plus identity-module imports in API routes. Counts are source call sites, not executed queries or unique operations. Query chains can perform multiple operations, and conditional branches may be exclusive.

Found **53 API route files / 237 literal call sites**, and **22 server module files / 88 literal call sites** (including the existing identity modules). The earlier ~15-route estimate is not a complete dependency count. A table reference alone does not establish duplicated business logic or identity ownership.

The core candidate behaviour was inspected in login, switch-role, profile, role-flags, signup, profile/update, artisan/profile and verification submission. Remaining route classifications are preliminary triage based on query context and responsibility; each needs full semantic review before extraction. This is not an exhaustive schema/dependency audit: dynamic table names, indirect helpers/RPCs, other source folders and related tables such as guarantors, addresses, OTP challenges and audit records are not counted. `identity-sync.ts` itself uses dynamic `.from(table)` in merge helpers.

## Existing boundary and coverage

- `identity-sync.ts` (996 lines): role registry, bank sync, full sync, merge detection/merge execution, identity status and audit log. Its public `Db` alias is still a Supabase client: routing callers here alone would not fully remove SDK coupling.
- `dual-t2-mirror.ts` (260 lines): shared Care approval, upgrade-only mirroring and backfill.
- `protect-approval.ts` (235 lines): pure protection against client demotion; Care resubmission exceptions.
- Existing identity-sync tests cover happy-path role registration/idempotency, bank copying, merge candidates, merge execution and status. Approval tests cover locks and resubmission. No dedicated dual-t2-mirror test file was found.
- Profile and role-flags have colocated route tests. Login/switch-role/signup/profile-update have none found; OTP send has rate-limit coverage in `src/lib/server/__tests__/rate-limit-routes.test.ts`. Client identity-submit tests verify request wiring, not server approval semantics. Test presence is not proof of coverage or current passing status; no tests were run for this documentation-only inventory.

## Behaviour findings to preserve or review separately

| Area | Observed behaviour / extraction constraint |
|---|---|
| Login | Repairs missing shared profiles from Auth metadata; blocks explicitly inactive profiles; loads slim role fields; registers roles and syncs bank then reloads; sync failures are non-fatal; does not auto-merge accounts. |
| Switch role | Requires an existing active shared profile and completed target side-profile; returns needs_signup instead of creating it; preserves primary role and counts actual switches; retries role-only update when the first update fails; sets pro Away for either target; syncs bank and returns mapped role/verification fields. |
| Profile / role-flags | Session-only own-user reads; profile returns null when shared row is missing; role flags derive existence/creation dates; preserve differing projections and primary-role/bank precedence rather than blindly sharing one output mapper. |
| Signup | Mixes Auth account creation/attachment, phone duplicate checks, shared/side-profile writes, migration fallback, opposite-role deletion on some paths, guarantor/security/referral side effects, role registration and merge detection. Needs its own batch. |
| Profile update | Mixed shared/side-profile patches, guarantor and Auth password updates, bank sync. Local uniqueness matcher reads only side tables; payment matcher also reads payout_methods. Preserve mismatch during extraction; reconcile only under separately agreed behaviour change. |
| Artisan profile | Reads both roles; may create a draft pro row; validates pipeline transitions; patches onboarding/liveness/bank fields; recomputes visibility and writes platform audit. Keep transition and side-effect order. |
| Verification submit | Customer/pro submission uses approval protection, legacy-column fallbacks and merge detection. Keep encrypted fields, approved locks and Care resubmit rules. |
| Admin role replacement | Deletes the opposite side-profile (both for admin) and creates target defaults. This differs materially from user dual-role switching; do not reuse the switch operation. |
| Merge / deletion | Cross-table, destructive lifecycle work. Inventory only; needs a dedicated plan and failure/concurrency review before any extraction. |
| Marketplace / jobs / payments | Share profile tables for availability, pricing, settlement or display. Keep these with their owning domains in this slice; protected job/fee/assignment modules are excluded. |

## API caller inventory

Tables below use P=profiles, M=motorist_profiles, R=repair_pro_profiles, U=user_roles, B=payout_methods, L=identity_sync_log, Q=identity_merges. Read/write operations are the first method after `.from(...)`; `select` may include exact-count/head queries. Each source link points to the first matched call; paired JSON records every matched line/table/operation. Tests column lists colocated test presence only.

### First batch (2 routes)

| Route source | Methods | Table operations / sites | Existing identity module | Colocated tests |
|---|---|---|---|---|
| [auth/login](../../src/app/api/auth/login/route.ts#L71) | POST | M select ×1, P select ×1, P upsert ×1, R select ×1 | identity-sync | None found |
| [auth/switch-role](../../src/app/api/auth/switch-role/route.ts#L77) | POST | M select ×3, P select ×1, P update ×2, R select ×3, R update ×2 | identity-sync | None found |

### Read-only next (4 routes)

| Route source | Methods | Table operations / sites | Existing identity module | Colocated tests |
|---|---|---|---|---|
| [account/role-flags](../../src/app/api/account/role-flags/route.ts#L22) | GET | M select ×1, R select ×1 | — | Yes |
| [admin/users/[id]](../../src/app/api/admin/users/[id]/route.ts#L32) | GET | M select ×1, P select ×1, R select ×1 | identity-sync | None found |
| [admin/users](../../src/app/api/admin/users/route.ts#L32) | GET | M select ×1, P select ×2, R select ×2 | — | None found |
| [profile](../../src/app/api/profile/route.ts#L31) | GET | M select ×1, P select ×1, R select ×1 | — | Yes |

### Profile creation/update (3 routes)

| Route source | Methods | Table operations / sites | Existing identity module | Colocated tests |
|---|---|---|---|---|
| [artisan/profile](../../src/app/api/artisan/profile/route.ts#L62) | GET, PATCH | M select ×1, P select ×1, R select ×3, R update ×1, R upsert ×1 | — | None found |
| [auth/signup](../../src/app/api/auth/signup/route.ts#L399) | POST | M delete ×1, M upsert ×1, P select ×1, P upsert ×2, R delete ×1, R select ×1, R upsert ×1 | identity-sync | None found |
| [profile/update](../../src/app/api/profile/update/route.ts#L45) | POST | M select ×3, M upsert ×1, P select ×1, P update ×1, R select ×4, R upsert ×1 | identity-sync | None found |

### OTP / phone verification (3 routes)

| Route source | Methods | Table operations / sites | Existing identity module | Colocated tests |
|---|---|---|---|---|
| [auth/otp/profile-verify](../../src/app/api/auth/otp/profile-verify/route.ts#L32) | POST | M update ×1, P select ×1, P update ×1, R update ×1 | — | None found |
| [auth/otp/send](../../src/app/api/auth/otp/send/route.ts#L86) | POST | P select ×2 | — | None found |
| [auth/otp/verify](../../src/app/api/auth/otp/verify/route.ts#L69) | POST | M select ×2, M update ×1, P select ×2, P update ×2, R select ×2, R update ×1 | — | None found |

### Care / verification (10 routes)

| Route source | Methods | Table operations / sites | Existing identity module | Colocated tests |
|---|---|---|---|---|
| [admin/customer-review](../../src/app/api/admin/customer-review/route.ts#L45) | GET, PATCH | M select ×12, M update ×7, P select ×2, R select ×1, R update ×1 | dual-t2-mirror | None found |
| [admin/motorists/[id]/verify](../../src/app/api/admin/motorists/[id]/verify/route.ts#L59) | POST | M update ×2 | dual-t2-mirror | None found |
| [admin/pro-review](../../src/app/api/admin/pro-review/route.ts#L31) | GET, PATCH | M select ×1, P select ×2, R select ×6, R update ×8 | dual-t2-mirror | None found |
| [admin/pros/[id]/bank](../../src/app/api/admin/pros/[id]/bank/route.ts#L42) | GET | R select ×1 | — | None found |
| [admin/pros/[id]/status](../../src/app/api/admin/pros/[id]/status/route.ts#L37) | PATCH | R update ×1 | — | None found |
| [admin/users/[id]/status](../../src/app/api/admin/users/[id]/status/route.ts#L40) | PATCH | P update ×1 | — | None found |
| [admin/verification](../../src/app/api/admin/verification/route.ts#L67) | GET, PATCH | M select ×2, M update ×4, P select ×1, R select ×2, R update ×5 | dual-t2-mirror | None found |
| [liveness/verify](../../src/app/api/liveness/verify/route.ts#L59) | POST | R select ×1, R update ×1 | — | None found |
| [verify/customer-id](../../src/app/api/verify/customer-id/route.ts#L86) | POST | M insert ×1, M select ×1, M update ×2, P select ×1 | identity-sync, protect-approval | None found |
| [verify/pro-id](../../src/app/api/verify/pro-id/route.ts#L78) | POST | P update ×1, R select ×1, R update ×2, R upsert ×1 | identity-sync, protect-approval | None found |

### Identity operations (2 routes)

| Route source | Methods | Table operations / sites | Existing identity module | Colocated tests |
|---|---|---|---|---|
| [admin/identity/merges/[id]](../../src/app/api/admin/identity/merges/[id]/route.ts#L37) | POST | Q select ×1, Q update ×1 | identity-sync | None found |
| [admin/identity](../../src/app/api/admin/identity/route.ts#L24) | GET, POST | Q select ×1, L select ×1, M select ×1, P select ×1, R select ×1, U select ×1 | identity-sync | None found |

### Destructive lifecycle / role replacement (6 routes)

| Route source | Methods | Table operations / sites | Existing identity module | Colocated tests |
|---|---|---|---|---|
| [admin/deletion/[userId]](../../src/app/api/admin/deletion/[userId]/route.ts#L31) | POST | P update ×2 | — | None found |
| [admin/deletion-requests](../../src/app/api/admin/deletion-requests/route.ts#L22) | GET, POST | P select ×1, P update ×2 | — | None found |
| [admin/users/[id]/role](../../src/app/api/admin/users/[id]/role/route.ts#L44) | PATCH | M delete ×2, M upsert ×1, P select ×1, P update ×1, R delete ×2, R upsert ×1 | — | None found |
| [auth/delete-account](../../src/app/api/auth/delete-account/route.ts#L26) | POST | P update ×1, U update ×2 | — | None found |
| [auth/deletion-status](../../src/app/api/auth/deletion-status/route.ts#L18) |  | P select ×1 | — | None found |
| [auth/restore-account](../../src/app/api/auth/restore-account/route.ts#L19) | POST | P select ×1, P update ×1 | — | None found |

### Admin reporting / staff auth (8 routes)

| Route source | Methods | Table operations / sites | Existing identity module | Colocated tests |
|---|---|---|---|---|
| [admin/auth/login](../../src/app/api/admin/auth/login/route.ts#L53) | POST | P select ×1 | — | None found |
| [admin/dashboard](../../src/app/api/admin/dashboard/route.ts#L32) | GET | M select ×2, P select ×1, R select ×2 | — | None found |
| [admin/docs](../../src/app/api/admin/docs/route.ts#L77) | GET | M select ×1, R select ×1 | — | None found |
| [admin/motorists](../../src/app/api/admin/motorists/route.ts#L33) | GET | M select ×1, P select ×2 | — | None found |
| [admin/pending-counts](../../src/app/api/admin/pending-counts/route.ts#L30) | GET | M select ×3, R select ×5 | — | None found |
| [admin/pros](../../src/app/api/admin/pros/route.ts#L32) | GET | P select ×1, R select ×1 | — | None found |
| [admin/staff](../../src/app/api/admin/staff/route.ts#L49) | GET, PATCH | P select ×3, P update ×1 | — | None found |
| [cron/analytics-rollup](../../src/app/api/cron/analytics-rollup/route.ts#L53) | GET, POST | P select ×1 | — | None found |

### Other domain dependencies (15 routes)

| Route source | Methods | Table operations / sites | Existing identity module | Colocated tests |
|---|---|---|---|---|
| [admin/dispatch](../../src/app/api/admin/dispatch/route.ts#L258) | GET, POST | P select ×1, R select ×1 | — | None found |
| [admin/payments/[id]](../../src/app/api/admin/payments/[id]/route.ts#L182) | GET | P select ×2, R select ×1 | — | None found |
| [auth/logout](../../src/app/api/auth/logout/route.ts#L75) | POST | R update ×1 | — | None found |
| [callout/preview](../../src/app/api/callout/preview/route.ts#L36) | POST | R select ×1 | — | None found |
| [conversations](../../src/app/api/conversations/route.ts#L67) | GET | P select ×1 | — | Yes |
| [jobs/[id]/pay](../../src/app/api/jobs/[id]/pay/route.ts#L75) | POST | P select ×1 | — | None found |
| [messages/notify](../../src/app/api/messages/notify/route.ts#L56) | POST | P select ×1 | — | None found |
| [messages/send](../../src/app/api/messages/send/route.ts#L104) | POST | P select ×1 | — | None found |
| [notifications/settings](../../src/app/api/notifications/settings/route.ts#L34) | PATCH, GET | P select ×2, P update ×1 | — | None found |
| [pros/[id]/reviews](../../src/app/api/pros/[id]/reviews/route.ts#L33) | GET | R select ×1 | — | None found |
| [pros/[id]](../../src/app/api/pros/[id]/route.ts#L40) | GET | P select ×1, R select ×1 | — | None found |
| [pros/live](../../src/app/api/pros/live/route.ts#L89) | POST, GET | P update ×1, R select ×6, R update ×3 | — | None found |
| [pros](../../src/app/api/pros/route.ts#L92) | GET | P select ×1, R select ×2 | — | Yes |
| [requests](../../src/app/api/requests/route.ts#L59) | GET | P select ×1 | — | Yes |
| [security/action](../../src/app/api/security/action/route.ts#L167) | POST | M update ×2, P select ×5, P update ×2, R select ×1, R update ×2 | — | None found |

### Routes already using identity operations without matched table calls

- [src/app/api/admin/identity/dual-t2-backfill/route.ts](../../src/app/api/admin/identity/dual-t2-backfill/route.ts): dual-t2-mirror. This is a literal-scan finding, not proof of zero indirect database access.
- [src/app/api/admin/users/[id]/sync/route.ts](../../src/app/api/admin/users/[id]/sync/route.ts): identity-sync. This is a literal-scan finding, not proof of zero indirect database access.

## Server dependencies

These are inventory evidence, not authorization to refactor protected modules or expand Slice 5.

| Module | Literal sites | Tables |
|---|---|---|
| [src/lib/server/admin-auth.ts](../../src/lib/server/admin-auth.ts#L173) | 1 | P |
| [src/lib/server/callout/acceptance.ts](../../src/lib/server/callout/acceptance.ts#L99) | 1 | R |
| [src/lib/server/express/payments.ts](../../src/lib/server/express/payments.ts#L225) | 1 | P |
| [src/lib/server/express/store.ts](../../src/lib/server/express/store.ts#L97) | 2 | P, R |
| [src/lib/server/health-service.ts](../../src/lib/server/health-service.ts#L81) | 3 | M, P, R |
| [src/lib/server/identity/dual-t2-mirror.ts](../../src/lib/server/identity/dual-t2-mirror.ts#L97) | 6 | M, R |
| [src/lib/server/identity/identity-sync.ts](../../src/lib/server/identity/identity-sync.ts#L46) | 30 | B, L, M, P, Q, R, U |
| [src/lib/server/jobs/job-store/create.ts](../../src/lib/server/jobs/job-store/create.ts#L178) | 1 | P |
| [src/lib/server/jobs/job-store/dispatch.ts](../../src/lib/server/jobs/job-store/dispatch.ts#L197) | 2 | P, R |
| [src/lib/server/jobs/job-store/hydrate.ts](../../src/lib/server/jobs/job-store/hydrate.ts#L12) | 5 | M, P |
| [src/lib/server/jobs/job-store/notifications.ts](../../src/lib/server/jobs/job-store/notifications.ts#L120) | 2 | R |
| [src/lib/server/jobs/job-store/payments.ts](../../src/lib/server/jobs/job-store/payments.ts#L385) | 3 | M, R |
| [src/lib/server/jobs/job-store/reads.ts](../../src/lib/server/jobs/job-store/reads.ts#L140) | 1 | P |
| [src/lib/server/market-scope.ts](../../src/lib/server/market-scope.ts#L48) | 4 | P, R |
| [src/lib/server/merit/merit-engine.ts](../../src/lib/server/merit/merit-engine.ts#L329) | 2 | R |
| [src/lib/server/modules/care-service.ts](../../src/lib/server/modules/care-service.ts#L90) | 8 | M, P, R |
| [src/lib/server/pairing/pairing-engine.ts](../../src/lib/server/pairing/pairing-engine.ts#L266) | 2 | P, R |
| [src/lib/server/payments/bank-lookup.ts](../../src/lib/server/payments/bank-lookup.ts#L21) | 8 | B, M, P, R |
| [src/lib/server/pro-visibility.ts](../../src/lib/server/pro-visibility.ts#L23) | 2 | R |
| [src/lib/server/reviews.ts](../../src/lib/server/reviews.ts#L111) | 2 | P, R |
| [src/lib/server/security/security-store.ts](../../src/lib/server/security/security-store.ts#L1843) | 1 | P |
| [src/lib/server/shop/catalog.ts](../../src/lib/server/shop/catalog.ts#L37) | 1 | P |

## Approved first-batch plan and later proposed work

1. First implementation batch: login and switch-role only (2 routes, 15 literal sites). Characterize both before edits, including inactive/missing rows, query errors, role-only fallback, pro Away, bank sync/reload and response mapping. Auth/token validation and HTTP responses remain route concerns.
2. Add focused identity persistence operations alongside identity-sync; preserve existing sync behaviour. Return typed results without leaking PostgREST query builders. Avoid arbitrary-table generic CRUD interfaces and adding to the 996-line identity-sync monolith. New modules stay within the 300-line convention.
3. Review the first diff and then agree subsequent batches: own-profile/role-flags reads; signup/profile updates; OTP; Care/admin operations. The inventory does not authorize all 53 routes for implementation.
4. Keep destructive merges/deletion/admin role replacement, staff auth/reporting and other-domain dependencies deferred unless separately scoped. No planned schema migration, UI change or product-rule change for the first batch.

## Reviewer procedure and proposed criteria

| ID | Expected behaviour | Affected areas | Verification | Status / evidence |
|---|---|---|---|---|
| inventory | Literal callers and existing boundary are recorded with source evidence and scope limits. | API / server inventory | Static scan and source inspection | Pass: paired JSON contains 53 routes / 237 sites and 22 modules / 88 sites at source commit. |
| scope | Exact implementation batch and criteria approved before feature code. | First batch / guide | User review of proposed plan | Pass: user approved the proposed first batch with “let's go” on 2026-10-10. |
| contracts | Preserve response payloads/statuses, authentication, inactive/missing handling, role flags and primary-role calculations. | Login / switch-role | Characterization and route tests; diff review | Pass locally: 32 route characterization tests passed before and after extraction. |
| mutations | Preserve projections, write guards/order, migration fallbacks, pro Away, bank precedence/sync/reload and audit side effects. | New identity modules / routes | Adapter tests including failures; diff review | Pass locally: 9 additional persistence/projection tests; 15 literal table sites, selects and user filters compared with originals. |
| boundary | Agreed routes delegate identity persistence through named typed operations; modules follow size convention. | Login / switch-role / identity | Import/table-call audit; typecheck | Pass locally: both routes have no service-client/table calls or row-type imports; all four new identity modules are under 300 lines; typecheck passes. |
| regressions | Relevant characterization tests, lint, typecheck and full test suite pass; approval guards and protected rules preserved. | Repository | Required local gates before commit | Pass locally: 1,395 tests / 133 files; typecheck; lint 0 errors / 160 warnings (none in changed files); diff check. |
| live | Hosted login, role switching, inactive account, missing target role and shared-bank smoke pass on deployed reviewed commit. | Hosted app | Authorized deployment and test-account smoke evidence | Pending; no deployment performed. |

## Boundaries and limitations

Source commit is the inventory baseline, not a reviewed implementation commit. Existing issues found above are not fixed or newly approved product changes. Frozen product/protected-file rules apply. No live data or credentials were read. Static counts do not establish complete behavioural coverage.

## Implementation and local evidence (2026-10-10)

- `login-identity.ts` owns load, role registration, bank sync and reload; `login-profile.ts` preserves the original repair/query/mapping function.
- `switch-identity.ts` owns existing-profile/target-role guards, active-role writes and fallback, pro Away and sync; `switch-profile.ts` preserves the switch-specific query/mapping and role-registry response.
- Routes retain body validation, Supabase Auth calls, login rate limiting and HTTP/error mapping. Supabase Auth SDK use remains intentional; provider isolation is a later stage. Internal switch projection still accepts a Supabase client, confined to the identity implementation; exported route-facing operations accept identity values and return typed results, not clients/query builders.
- All four new production modules are below 300 lines. Existing identity-sync, approval/mirror modules, product/protected files and migrations are unchanged. No new environment variables or schema changes are needed by this relocation.
- Before edits, the 2 new route test files passed 32 characterization cases against the original routes. The same tests pass after extraction. They cover both roles, missing/inactive profiles, profile repair, token/config/validation failures, sync/reload, role-only fallback, pro Away and differing returned-error/thrown-error behaviour. Nine additional persistence/projection cases cover returned query errors, thrown reads, legacy null active flags, metadata defaults, projections and field precedence.
- Full local gate: `npm run test` — 1,395 tests / 133 files passed; `npm run typecheck` passed; `npm run lint` — 0 errors / 160 warnings, none in changed files; `git diff --check` passed. Source comparison verified the same 15 literal table sites, selects and user filters. Login loader and switch projection are verbatim relocations apart from export/function/return wrappers.

## Boundaries of the evidence

Route characterization runs real new identity modules with a scripted database; existing identity-sync exports are mocked to control sync success/failure. Existing identity-sync tests run in the full suite. These checks do not prove deployed schema behaviour, concurrency or external Auth availability. The existing non-transactional writes, broadly triggered role-only fallback, ignored returned sync/availability errors and login/switch differences in inactive-flag handling are preserved, not fixed by this slice.

## Remaining work

Code: independently review the exact resulting commit (independent review pending); agree later batches before implementation. Signup/profile updates, OTP, Care/admin operations and the destructive/other-domain candidates in the inventory remain deferred, not closed. No additional first-batch implementation or local test work is currently identified after the recorded gates.

External: hosted smoke on the deployed reviewed commit remains pending: password login, both role-switch directions, inactive account, missing target role, pro Away and shared-bank behaviour. No new configuration/migration need identified for this first batch; deployment and hosted evidence have not been performed.

## Closeout

First batch implemented and locally verified against the working tree based on `ed07d76d8518da279e4553dfb00c0e09841a4976`. Reviewed implementation commit: pending independent review. Independent review and hosted verification remain pending. Broader Slice 5 and Stage 4 are not closed. This is the separate Supabase decoupling effort; the parent guide excludes it from BACKEND_FIXES_STATUS.md's numbered report-issue ledger.

## Batch 2: own-profile and role-flags reads (implemented locally)

User approved this batch on 2026-10-10. Baseline: `a3dd798` (batch 1). Scope is GET `/api/profile` and GET `/api/account/role-flags` only. Move profile reads/mapping into `own-profile.ts` and role-existence reads into `role-flags.ts`. Routes keep configuration guards, requireUser, HTTP responses and exception mapping. Preserve all selects, session-derived filters, guarantor mapping, active-role bank precedence, stored/derived primary-role behaviour and returned-error versus thrown-error semantics. Do not introduce sync or repair writes into these reads.

| Criterion | Verification | Status |
|---|---|---|
| Caller isolation / contracts | Existing and extended route tests: client query userId cannot override session; 401/503 do not query; null shared profile stays 200/null. | Pass: before/after route characterization |
| Projection / fallback parity | Characterization: both roles, stored primary and creation-date fallback, identity status, bank fallback, guarantor and query errors. | Pass: 26 route tests |
| Defined read interfaces | Routes contain no table/client/row-mapper access; new modules below 300 lines; same 6 read sites including guarantor; no writes. | Pass: source audit; modules 211 / 41 lines |
| Local gates | Focused tests before/after; full tests, typecheck, lint and diff check. | Pass: 1,412 tests / 133 files; typecheck; lint 0 errors / 160 warnings, none in changed files; diff check |
| Hosted evidence | Own-profile and role-flags smoke on deployed reviewed commit with two accounts / both roles. | Pending |

Independent review of the implementation commit remains pending. Later admin reads, signup/update, OTP and Care/lifecycle batches are excluded. No migration or configuration change planned.

Batch 2 evidence: 17 new characterization cases extend the 9 existing route tests. All 26 passed against original routes before extraction and unchanged after. Source comparison confirms verbatim query/mapping relocation after indentation, function parameter and return-wrapper changes. The session user ID is the only ID passed to each operation. `own-profile.ts` reads profiles, both role tables and guarantors; `role-flags.ts` retains its slim role/creation-date selects. All six query sites remain scoped and select-only. Existing returned-error fallback and thrown-error response behaviour is intentionally unchanged.

Batch 2 remaining code: independent review of the exact resulting commit (independent review pending); later admin, signup/update, OTP and Care/lifecycle batches still need agreed scope. No further batch 2 implementation/local verification gap identified. External: deploy reviewed changes and record two-account/both-role profile/flags smoke; no deployment or configuration/migration change performed. Tests use scripted/mocked database replies and do not establish hosted behaviour.
