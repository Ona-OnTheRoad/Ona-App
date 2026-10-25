# Signup dual-role service client review guide

## Goal

A signed-in motorist who adds the Repair Pro role (or a pro adding Customer) fails at the last step with `Account saved but profile failed: permission denied for table profiles`. The same failure hits the signed-out "email already exists" recovery path.

Cause: `POST /api/auth/signup` calls `supabase.auth.signInWithPassword` on its `createServiceSupabase()` client. supabase-js keeps that session in memory on the client instance, and `_getAccessToken()` then sends the user's JWT instead of the service key. Every later `.from(...)` write runs as `authenticated`, which migration `20261004_077_lock_client_writes.sql` correctly revoked from `profiles`.

Fix: password checks and the final browser session use a separate, throwaway anon client. The service client never signs in, so all writes stay `service_role`. The 077 lockdown is not changed.

## Expected change areas

- `src/app/api/auth/signup/route.ts`: the four `signInWithPassword` calls (attach check, existing-email recovery, final session issue and its retry) move to a separate anon client.
- `src/app/api/auth/signup/__tests__/route.test.ts`: new route characterization tests.
- No migrations, grants, policies, client/UI code or protected files (`docs/RULES.md` §10).

## Reviewer procedure

Inspect each requirement in `signup-dual-role-service-client.json` against the reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

| ID | Requirement | Expected behaviour | Verification | Evidence |
|---|---|---|---|---|
| R1 | Attach no longer fails | Signed-in motorist completes pro signup; `profiles.role = repair_pro` and a `repair_pro_profiles` row exists | Route test; live attempt on a test account | code + live |
| R2 | Service client never holds a user session | No `signInWithPassword` on the `createServiceSupabase()` client in the route | Test assertion; grep | code |
| R3 | Motorist side preserved | `motorist_profiles` row still exists after attach | Route test; live DB check | code + live |
| R4 | Password check still enforced | Wrong password on attach returns 401 `password_required` and writes nothing | Route test | code |
| R5 | New-account signup unchanged | Same status, body shape and returned session | Route test | code |
| R6 | 077 lockdown untouched | No migration or grant changes; `scripts/verify/client-write-lockdown.sql` still passes | Diff check; run verify SQL | code + live |
| R7 | Success events logged | A `signup_events` success row appears after signup (believed to be silently dropped today because it ran after the user sign-in) | Live DB check | live |
| R8 | No regressions | Full test suite, typecheck and lint pass; lint compared to baseline | Commands | code |

## Boundaries and limitations

- The "Account saved but profile failed" wording is misleading for an attach (nothing new was saved). Changing it is a separate UX change and is out of scope.
- Earlier findings in the same flow are out of scope: the attach upsert setting `avatar_url` to null, `primary_role` not set at signup, and server-side acceptance of client-locked identity fields.
- R7 is an expected side effect, not yet observed.

## Remaining work

- Code (follow-up, separate change): `src/app/api/security/action/route.ts` (change password, including a stray `signInWithPassword` with `email: ""`) and `src/app/api/admin/auth/login/route.ts` also sign in on the service client.
- External: live checks for R6 and R7 on the deployed environment; independent human review against `d4d1ff2`.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the issue state and the same remaining code and external work.

Merged to dev in PR #46 (`8b98687`); implementation commit `d4d1ff2`. Code/test: R2, R4, R5 and R8 pass. Live: QA validated R1 and R3 after merge (reported 2026-10-25; environment and accounts not recorded here). R6 and R7 remain pending, as does independent human review.
