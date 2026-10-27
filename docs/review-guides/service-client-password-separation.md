# Service Client Password Separation Review Guide

## Goal

Decouple `signInWithPassword` calls from the privileged `createServiceSupabase()` client in `POST /api/security/action` (specifically `change_password`) and `POST /api/admin/auth/login`.

In `@supabase/supabase-js`, `signInWithPassword` mutates the client instance in memory by attaching user JWT session tokens to all subsequent calls, stripping `service_role` privileges and downgrading the client to standard `authenticated` access.

Fix: Perform password verification and session token generation using a separate, throwaway anon client with `{ persistSession: false, autoRefreshToken: false }`. The privileged `service_role` client never calls `signInWithPassword`, keeping all admin database and auth operations strictly under `service_role`.

## Expected change areas

- `src/app/api/security/action/route.ts`: remove stray `email: ""` call; verify current password on a separate anon client; keep privileged client for `auth.admin.*` and database writes.
- `src/app/api/admin/auth/login/route.ts`: sign in via a separate client to acquire session tokens; query `profiles` using the unpolluted `service_role` client.
- `src/app/api/security/action/__tests__/route.test.ts`: test route characterization for password verification and service client isolation.
- `src/app/api/admin/auth/login/__tests__/route.test.ts`: test route characterization for admin login and service client isolation.
- No migrations, grants, or client UI code.

## Reviewer procedure

Inspect each requirement in `service-client-password-separation.json` against the reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

| ID | Requirement | Expected behaviour | Verification | Evidence |
|---|---|---|---|---|
| R1 | `change_password` uses separate client | `POST /api/security/action` (`change_password`) verifies password via dedicated client; `createServiceSupabase()` never calls `signInWithPassword` | Route test; code inspection | code |
| R2 | Stray `email: ""` call removed | No blank email sign-in call in `security/action/route.ts` | Diff check; grep | code |
| R3 | Admin login uses separate client | `POST /api/admin/auth/login` uses separate client for `signInWithPassword`; `createServiceSupabase()` remains pure `service_role` | Route test; grep | code |
| R4 | Auth behavior preserved | Password checks enforce correctness (401/403 on mismatch); admin session cookie is packed correctly on valid credentials | Route tests | code |
| R5 | No regressions | Full test suite, typecheck, and lint pass | Automated commands | code |

## Boundaries and limitations

- Does not change admin cookie lifetime or session hashing.
- Does not change user-facing validation error messages.

## Remaining work

- Code: None once tests pass.
- External: Deployed smoke test for user password change and admin login.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` and paired review guide in `docs/review-guides/signup-dual-role-service-client.json` (remaining work ledger).
