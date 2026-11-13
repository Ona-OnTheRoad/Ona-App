# Signup preflight hardening review guide

## Goal

Fix three signup gaps left as found during the signup route split: phone uniqueness capped at 500 rows, dual-role attach email mismatch silently ignored, and duplicated success payloads with a drifted `primaryService` field.

Agreed plan (approved by the repository owner on 2026-11-13):

1. Keep phone uniqueness on the DB-backed `findPhoneOwners` path already on `dev` (no 500-row scan); dual-role attach may still reuse the signed-in user's own phone.
2. On dual-role attach, when the submitted email differs from the session email and `keepOtherRole` is not false, rebind to the session email for profile writes, confirmation email and the success payload; keep `403 identity_mismatch` when `keepOtherRole` is false.
3. Build the success `profile` / `extras` payload once (including `phoneVerified`) and share it for session-ok and session-missing responses; align `primaryService` to `input.primaryService || input.services?.[0]`.

## Expected change areas

- `src/lib/server/signup/preflight.ts` — keep `findPhoneOwners`; `resolveAttachUser` returns rebound email.
- `src/app/api/auth/signup/route.ts` — use effective email from attach resolution when building context.
- `src/lib/server/signup/session.ts` — shared success body builder (preserves phone-proof stamping).
- `src/app/api/auth/signup/__tests__/route.test.ts` — coverage for R1–R5.
- `docs/BACKEND_FIXES_STATUS.md` and this guide pair.

Protected files (`docs/RULES.md` §10) are not touched. Verified flags remain Care-only.

## Reviewer procedure

Inspect each requirement in `signup-preflight-hardening.json` against the reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

| ID | Requirement | Expected behaviour | Verification | Evidence |
|---|---|---|---|---|
| R1 | Phone uniqueness without 500-row scan | Duplicate phone on another account is rejected via variant lookup; no `.limit(500)` full-table scan | Route test + code read | code |
| R2 | Attach may reuse own phone | Signed-in attach with the account's own phone still succeeds | Route test | code |
| R3 | Email rebind on dual attach | Attach + email mismatch + `keepOtherRole` true uses session email for profile, confirm and response | Route test | code |
| R4 | Hijack reject | Attach + email mismatch + `keepOtherRole` false returns `403 identity_mismatch` | Route test | code |
| R5 | Shared success payload | One builder for both session outcomes; `primaryService` fallback consistent | Code read + route test | code |
| R6 | Verified flags unchanged | Diff does not set `nin_verified` / `bvn_verified` from lookup or digits | Diff review | code |
| R7 | Local suite | `npm test`, lint (0 errors), typecheck, server-boundaries, openapi-drift | Commands | code |
| R8 | Live QA | Customer signup, Repair Pro signup, dual-role attach with matching and mismatched email | Live | live |

## Boundaries and limitations

- No migration or DB unique constraint in this change.
- Contact-change OTP, admin `id_lookup` UI, Care name-mismatch policy and the six unstarted ID items are out of scope.
- Live provider and hosted checks stay pending.

## Remaining work

See the JSON guide (`remainingWork.code` and `remainingWork.external`).

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the same remaining code and external work. Record the reviewed commit when available.
