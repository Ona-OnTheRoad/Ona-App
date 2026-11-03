# Unified Bank Uniqueness Check Review Guide

## Goal

Unify bank account uniqueness verification between `POST /api/payments/check-bank-unique` and `POST /api/profile/update`.

Prior to this fix, `src/app/api/profile/update/route.ts` used a private duplicate helper `isBankAccountTakenByOtherUser` that only queried `motorist_profiles` and `repair_pro_profiles`, omitting `payout_methods`. This allowed an account already tied to a user's payout methods to be flagged as taken in one route but accepted in another.

This closes the tracked defect in `docs/review-guides/supabase-core-separation-stage-4.json` (bank account uniqueness disagreement).

## Expected change areas

- `src/app/api/profile/update/route.ts`: replace `isBankAccountTakenByOtherUser` with canonical `isBankAccountTaken` from `@/lib/server/payments/bank-lookup`.
- `src/app/api/profile/update/__tests__/route.test.ts`: test characterization for bank uniqueness checks including payout_methods coverage and own-account updates.
- `docs/review-guides/supabase-core-separation-stage-4.json`: update defect status to `pass`.

## Reviewer procedure

Inspect each requirement in `unified-bank-uniqueness-check.json` against the reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

| ID | Requirement | Expected behaviour | Verification | Evidence |
|---|---|---|---|---|
| R1 | Single canonical bank uniqueness check | `profile/update/route.ts` imports and uses `isBankAccountTaken` from `@/lib/server/payments/bank-lookup`; private duplicate removed | Diff check; grep | code |
| R2 | Full table coverage on profile update bank saves | Bank uniqueness check in `profile/update` checks `motorist_profiles`, `repair_pro_profiles`, and `payout_methods` | Route test asserting conflict against `payout_methods` | code |
| R3 | Own bank account re-save allowed | Updating profile with existing bank details passes via `excludeUserId: userId` | Route test | code |
| R4 | Stage 4 review guide defect closed | Defect in `supabase-core-separation-stage-4.json` updated to pass | File inspection | code |
| R5 | No regressions | Full test suite, typecheck, and lint pass | Automated commands | code |

## Boundaries and limitations

- Does not change how banks or NUBANs are formatted or validated.
- Does not modify existing Flutterwave or bank resolution APIs.

## Remaining work

- Code: None once tests pass.
- External: Verification in deployed environment.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` and `docs/review-guides/supabase-core-separation-stage-4.json`.
