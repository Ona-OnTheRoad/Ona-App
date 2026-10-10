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

## Slice 1 (this slice): payments route handlers

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

## Remaining slices (not started)

- Slice 2 candidate: jobs' 3 bypassing route handlers (`surface`,
  `dispatch-scheduled`, `expire-stale`) — route them through `job-store`.
- Pairing: needs a design decision before any code — does `pairing-engine.ts`
  get folded into the jobs interface (since it writes the same table) or get
  a sibling interface? Not just a mechanical port like slice 1.
- Shop: largest slice, needs a boundary built from scratch; also needs
  deciding whether the admin routes with no domain-folder home (analytics,
  deliveries, couriers) get new files in `src/lib/server/shop` or stay
  route-local but Supabase-free.
- Identity: centralizing ~15 duplicated caller routes onto `identity-sync.ts`
  is the biggest call-site count of any domain.

## Reviewer procedure

Same as Stages 1-3: inspect each requirement below against the reviewed
commit; confirm no behavior change for slice 1 (same queries/tables/fallback
semantics, just relocated); record code evidence separately from hosted
evidence; never mark an unrun check passed.

## Exit criteria (from the parent plan, Stage 4 subset)

Business services in the agreed scope use defined interfaces rather than
Supabase SDK types or clients directly — verified via manual import audit of
`src/lib/server/{jobs,payments,pairing,shop,identity}`. This guide tracks
per-slice progress toward that, not a one-shot pass/fail.

## Closeout

Reviewed commit: pending — slice 1 not yet committed. Independent review and
hosted verification are pending for all of Stage 4, same as Stages 2-3.
