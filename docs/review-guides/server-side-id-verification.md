# Server-side ID verification review guide

## Goal

Make the NIN/BVN check something the server does and records, so "verified" no longer means "the number has 11 digits" (tracking items ONA-ID-203 and ONA-ID-205, batch 2 of 3).

Agreed plan (approved by the repository owner on 2026-11-13):

5. Run the NIN/BVN lookup on the server at signup and at ID submission and store the outcome (provider, mode, reference, matched name, time). Stop setting `nin_verified` / `bvn_verified` from number length. Never downgrade a Care-approved profile.
6. The `nin` kind of `POST /api/verify/pro-id` writes one number into both the NIN and BVN fields. Check the UI: fix it if it is clearly a bug, otherwise record an open product decision.
7. Compare the BVN holder name with the profile name and the payout bank account name. A mismatch never auto-verifies; flag it in the admin review data. Do not block or alter payouts.

This branch starts from `fix/otp-and-id-lookup-hardening` (batch 1), because the server lookup relies on its fail-closed behaviour and on the `prembly.ts` split.

## Decisions taken from the existing code

- In this codebase `nin_verified` / `bvn_verified` mean "approved by Care". The pro signup path already says "Digits collected ≠ care-approved". This change keeps that meaning: a provider lookup, matched or not, is **evidence for Care** and never sets a verified flag by itself.
- Requirement 6 is a bug, not a product question: the only caller of the `nin` kind is the onboarding step titled "BVN · Tier 3" with the placeholder "11-digit BVN" (`src/components/artisan/artisan-onboarding/bvn-tier.tsx`). The number is a BVN, so it now goes to the BVN fields only.

## Expected change areas

- `src/lib/server/identity/name-match.ts` (new) — name comparison.
- `src/lib/server/identity/id-lookup.ts` (new) — runs the lookup, builds the stored record, merges it into `gov_id_meta.idLookup`, builds the admin summary.
- `src/lib/server/identity/signup-id-check.ts` (new) — signup gate and best-effort store.
- `src/app/api/auth/signup/route.ts` — calls the gate before the account is created; motorist verified flags no longer come from length; response `ninVerified` / `bvnVerified` reflect stored flags.
- `src/app/api/verify/pro-id/route.ts`, `src/app/api/verify/customer-id/route.ts` — record the lookup at ID submission; the `nin` kind writes BVN fields only.
- `src/app/api/admin/pro-review/route.ts`, `src/app/api/admin/customer-review/route.ts` — expose `id_lookup` with a `name_mismatch` flag.
- `src/lib/ng-id-verify-client.ts` — the signup pre-check becomes format-only, so each number is looked up once (on the server).

Protected files (`docs/RULES.md` §10) are not touched. No payout code is changed.

## Reviewer procedure

Inspect each requirement in `server-side-id-verification.json` against the reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

| ID | Requirement | Expected behaviour | Verification | Evidence |
|---|---|---|---|---|
| R1 | Signup runs the lookup on the server | A provided 11-digit NIN/BVN is looked up before the account is created. A provider rejection returns `422 id_verification_failed`; an unavailable provider returns `503 id_verification_unavailable`; nothing is created in either case. | Unit and route tests | code |
| R2 | The outcome is stored | `gov_id_meta.idLookup.{nin,bvn}` holds status, provider, mode, reference, matched name, name match and time, and never the raw number. Storing is best-effort and cannot fail signup. | Unit test | code |
| R3 | Verified flags no longer come from length | Motorist signup writes `nin_verified`, `bvn_verified` false and `identity_verified_at` null. A Care-approved row is never downgraded: signup refuses to re-attach an existing role (`409 role_exists`), and the upsert also keeps approved values defensively. The signup response reports the stored flags. | Route test | code |
| R4 | ID submission records the lookup | `pro-id` (BVN step and NIN/BVN government ID) and `customer-id` (Nigerian NIN/BVN) store the lookup outcome. A failed or unavailable lookup does not block the submission. | Route tests | code |
| R5 | BVN step writes BVN fields only | The `nin` kind of `pro-id` no longer overwrites `nin_encrypted`, `nin_last4` or the NIN entries in `gov_id_meta`. | Route test | code |
| R6 | Name match | Names are compared ignoring case, spacing, punctuation, accents and order; a match needs the surname plus one other name. Results: `match`, `mismatch`, `unknown`. | Unit test | code |
| R7 | Mismatch is flagged, never auto-verifies | No lookup result sets a verified flag. The admin review rows carry `id_lookup.name_mismatch`. No payout code changes. | Unit and route tests, diff inspection | code |
| R8 | No regressions | `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:server-boundaries`, `npm run check:openapi-drift` pass. | Automated commands | code |
| R9 | Hosted behaviour | With the provider key set, signup rejects a wrong NIN/BVN, stores the record for a right one, and Care sees the mismatch flag. | Live QA | live |

## Boundaries and limitations

- Care approval still sets `bvn_verified` when a BVN is on file, even if the record shows a name mismatch. That is a human decision made with the flag visible in the data; it is not blocked.
- The admin screens do not render the flag yet; it is in the API rows (`t2_id.id_lookup`, `identity.id_lookup`).
- Existing rows are not rewritten: motorists whose flags were set from number length at an earlier signup keep them until cleaned up.
- A provider outage blocks signup when a NIN/BVN is supplied (same as the earlier browser pre-check). The NIN cache in batch 3 softens this.
- `gov_id` submissions still store any primary ID number in the `nin_*` columns; only the BVN step was corrected.
- `src/app/api/auth/signup/route.ts` was already far over the 300-line limit and is not split here; new logic lives in new modules.
- The pro signup form sends its ID number as `nin` whatever the document type; only an 11-digit value is treated as a NIN.

## Remaining work

See the JSON guide (`remainingWork.code` and `remainingWork.external`).

## Closeout

`docs/BACKEND_FIXES_STATUS.md` carries the same state and residuals under "Identity hardening batch 2".
