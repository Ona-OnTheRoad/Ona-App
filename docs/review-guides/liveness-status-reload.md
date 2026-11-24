# Liveness status survives reload; readable wait time

## Goal

Two issues the user reported while testing on dev (2026-11-23):

1. After a successful Tier 3 liveness check, reloading `/verify` showed **Start** again. The dev row for the test Pro still had `face_liveness_verified = true` (19:01 UTC, Prembly `nin_face`). Cause: the server profile builders (`own-profile.ts` for `GET /api/profile`, `login-profile.ts`, `switch-profile.ts`) never copied `face_liveness_verified` into the app profile, and `profileToUserProfile` had no field for it. The "Verified" state existed only in the browser until the profile reloaded.
2. Hitting the server attempt limit showed "Retry in 1502s." The message is now "Try again in about 26 minutes."

## Expected change areas

- `src/lib/supabase/mappers.ts`, `src/lib/supabase/types.ts`: `faceLivenessVerified` / `faceLivenessAt` in the profile extras; liveness columns on `RepairProRow`.
- `src/lib/server/identity/own-profile.ts`, `login-profile.ts` (select also gains the three columns), `switch-profile.ts`: map the pro row's liveness.
- New `src/lib/format-wait.ts`; `src/lib/server/identity/liveness/guard.ts` uses it.
- Tests: `src/app/api/profile/__tests__/route.test.ts`, `src/lib/server/identity/__tests__/{login,switch}-profile.test.ts`, `src/lib/__tests__/format-wait.test.ts`, `src/app/api/liveness/verify/__tests__/route.test.ts`.
- No protected (`docs/RULES.md` §10) file is touched. `mappers.ts` was already over 300 lines (602 → 607).

## Reviewer procedure

Check each item in [`liveness-status-reload.json`](liveness-status-reload.json) against the reviewed commit. Code and test evidence is kept apart from hosted evidence. Never mark an unrun check passed.

## Boundaries and limitations

- Legacy rows tagged `legacy_self_attested` (migration 088) also have the flag set, so they show Verified too. That matches the grandfather decision.
- Ten other routes still say "Retry in Ns" (payments verify and resolve-account, OTP send, change-bank, change-contact, verify-password, security verify-identity). They can use `formatWait` in a follow-up.
- Successful checks also count toward the server budget (5 per user per 30 minutes), so repeated testing on one account hits the limit quickly.

## Remaining work

- **Code:** independent review; optional `formatWait` in the other rate-limited routes.
- **External:** on dev, pass liveness, reload `/verify` and see Verified (H1); hit the limit and see minutes (H2).

## Closeout

Not closed. Update `docs/BACKEND_FIXES_STATUS.md` when this merges.
