# Signup: no email recovery / single attach route

## Goal

Unsigned signup must never treat an existing email as dual-role recovery or overwrite an existing profile. Role attachment has one route only: a signed-in user posts signup with `access_token`. Agreed plan: this guide.

## Expected change areas

- `src/app/api/auth/signup/route.ts` — remove existing-email + password recovery; reject same-role attach; phone uniqueness exempt only the attach user id.
- `src/app/api/auth/signup/__tests__/route.test.ts` — recovery becomes `409`; add same-role attach reject and profile-unchanged checks.
- No migrations, grants, client/UI copy changes, or protected files (`docs/RULES.md` §10).

## Reviewer procedure

Inspect each requirement in `signup-no-email-recovery.json` against the reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

## Boundaries and limitations

- Dual-role attach via `access_token` + password remains supported; signed-out “same email + correct password” no longer attaches or logs the user through signup.
- Attach may still upsert role / side-table fields needed to add the other role; unsigned signup must not mutate any existing row.
- Frontend localStorage `account-registry` is out of scope (not server authority).
- Error code stays `email_exists` for unsigned collisions; same-role attach uses `role_exists`.

## Remaining work

List concrete follow-up after implementation. Separate code/test/review from hosted/live checks. Update this section and the paired JSON `remainingWork` at closeout.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the issue state and the same remaining code and external work. In the paired JSON guide, include `remainingWork: { "code": [], "external": [] }`, using explicit verified-none entries when appropriate.
