# Feature review guide: prune the idempotent-operations ledger

## Goal

`public.idempotent_ops` (migration `064`) gets one row for every OTP send that carries an op key, whether the send works or fails. Nothing deletes these rows, so the table keeps growing.

A row is only useful while a client might still send its op key. The browser drops its keys after 48 hours (`IDEM_KEY_TTL_MS` in `src/lib/jobs/idempotency.ts`), and `/api/ops/status` and `runIdempotent` only look rows up by op key. After 48 hours a row can't be read again.

A daily cron deletes ledger rows older than 7 days. The extra margin past 48 hours covers clock skew and a missed cron run.

Agreed plan (approved in conversation, 2026-11-21, 7-day retention):

1. `src/lib/server/idempotency-prune.ts`: `pruneIdempotentOps({ olderThanDays = 7, now })` deletes rows with `created_at` before the cutoff and returns `{ deleted, cutoff }`. The query uses the existing `idempotent_ops_created_at_idx` index. It deletes every row past the cutoff, including `running` rows, because a row still `running` after 7 days was abandoned.
2. `src/app/api/cron/prune-idempotent-ops/route.ts`: GET and POST. Auth goes through `hasSchedulerSecret()` (`src/lib/server/jobs/deadlines/scheduler-auth.ts`): it only accepts the secret in a header, compares it in timing-safe fashion, and refuses when no secret is configured. Returns 503 `no_db` when Supabase admin isn't configured, and 500 on a database error. Logs a single line with the deleted count.
3. `vercel.json`: schedule the route daily at `20 0 * * *`, a slot no other cron uses.
4. Tests for the prune module and the route.
5. Docs: add the new route to the cron table in `docs/VERCEL_DEPLOY.md`, and record it in `docs/BACKEND_FIXES_STATUS.md`.

## Expected change areas

- `src/lib/jobs/idempotency.ts`: the client key TTL is exported as `IDEM_KEY_TTL_MS` (renamed from the private `TTL_MS`; value unchanged), so a test can check that retention outlasts it.
- New: `src/lib/server/idempotency-prune.ts`, `src/app/api/cron/prune-idempotent-ops/route.ts`, and tests next to each.
- `vercel.json` (one new cron entry).
- `docs/VERCEL_DEPLOY.md`, `docs/BACKEND_FIXES_STATUS.md`.

Unchanged: `runIdempotent`, `/api/ops/status`, the client key store's behaviour, and the table schema. No migration and no protected file (`docs/RULES.md` §10).

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON guide against the exact reviewed commit. Record concrete implementation/test evidence and live evidence separately. Never mark an unrun check passed.

## Boundaries and limitations

- Every row type gets the same 7-day retention, whatever its `op_type`. Today OTP send is the only caller of `runIdempotent`. A future caller that needs replays beyond 7 days would need its own rule.
- Cron routes run daily on the Vercel Hobby plan, so the table can hold up to about 8 days of rows.
- One `delete` statement per run. At current volume that's a few hundred rows a day. Very high volume would need batched deletes.
- Out of scope here: `/api/cron/notification-retry` and `/api/cron/egress-ip` accepted a `?secret=` query parameter and ran without auth when no secret was set. Fixed separately in PR #107 ([cron-auth-fail-closed](cron-auth-fail-closed.md)).

## Remaining work

Code and review:
- Independent review against the implementation commit.
- ~~Separate fix: `/api/cron/notification-retry` and `/api/cron/egress-ip` should use `hasSchedulerSecret()`.~~ Done in PR #107.

External and deployment:
- Vercel sends `CRON_SECRET` as the Bearer token. Confirm it's set on every host that runs crons, or this route returns 401 and prunes nothing.
- After deploy, confirm the cron run in the Vercel log and that no rows older than about 8 days remain. On 2026-11-21 the dev Supabase project held 22 rows, 10 of them older than 7 days.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the issue state and the same remaining code and external work. In the paired JSON guide, include `remainingWork: { "code": [], "external": [] }`, using explicit verified-none entries when appropriate.
