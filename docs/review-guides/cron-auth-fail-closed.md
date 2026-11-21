# Feature review guide: every cron route fails closed

## Goal

Six routes check the cron secret with their own copy of `cronAuthorized()`, and each copy is weaker than the shared `hasSchedulerSecret()` in `src/lib/server/jobs/deadlines/scheduler-auth.ts`. That helper accepts the secret only in a header, compares it in constant time, and refuses the call when no secret is configured.

| Route | What it does | Today, with no secret configured | Other gaps |
| --- | --- | --- | --- |
| `/api/security/cashout/verify` | Retries and settles cashouts: wallets, reservations, refunds, payout ledger | **Open to anyone** | `?secret=`; plain compare; only the first configured secret |
| `/api/payments/payout-retry` | Retries Repair Pro payouts | Open to anyone whose `User-Agent` contains `vercel-cron` (a spoofable header), or to everyone when `ALLOW_OPEN_PAYOUT_CRON=true` on Vercel | `?secret=`; plain compare |
| `/api/cron/egress-ip` | Probes the payout proxy, writes `ona_cron_config`, emails the admin | Open to a spoofed `vercel-cron` `User-Agent` | `?secret=`; plain compare |
| `/api/cron/notification-retry` | Resends queued push, SMS and email | **Open to anyone** | `?secret=`; plain compare; first secret only |
| `/api/cron/analytics-rollup` | Upserts `analytics_daily_rollups` | **Open to anyone** | `?secret=`; plain compare; first secret only |
| `/api/cron/purge-accounts` | Runs `purge_expired_deletions` (permanent account deletion) | Closed on production and preview, **open locally** | `CRON_SECRET` only; plain compare |

A secret in the query string also ends up in access logs, browser history and the `Referer` header.

Agreed plan (approved in conversation, 2026-11-21):

1. Replace the local `cronAuthorized()` / `authorized()` in each of the six routes with `hasSchedulerSecret(req)`. Delete the local functions, the `?secret=` handling, the `vercel-cron` `User-Agent` check and `ALLOW_OPEN_PAYOUT_CRON`.
2. `payout-retry` keeps its second path: a signed-in admin with the `escrow_release` permission can still run it.
3. Each route keeps its current status codes and response bodies after auth. Only who gets past auth changes.
4. Tests: one route test file per route (there are none today). Each one refuses a request with no secret, a wrong secret, a near-miss secret, `?secret=`, a spoofed `vercel-cron` `User-Agent`, and an unset secret under `NODE_ENV=development`, and in every refused case the work function is never called. Each accepts `Authorization: Bearer` and `x-cron-secret`. For `payout-retry`: an admin with `escrow_release` passes, and a refused admin gets the admin error.
5. Docs: update the rows for these routes in `docs/MUTATION_INVENTORY.md`, the cron notes in `docs/VERCEL_DEPLOY.md` (header only, fails closed), and `docs/BACKEND_FIXES_STATUS.md`.

## Expected change areas

- `src/app/api/security/cashout/verify/route.ts`, `src/app/api/payments/payout-retry/route.ts`, `src/app/api/cron/{egress-ip,notification-retry,analytics-rollup,purge-accounts}/route.ts`, and a `__tests__/route.test.ts` next to each.
- New shared test cases: `src/test-utils/scheduler-auth-cases.ts`.
- `docs/MUTATION_INVENTORY.md`, `docs/VERCEL_DEPLOY.md`, `docs/BACKEND_FIXES_STATUS.md`.

Unchanged: `hasSchedulerSecret()` itself, the work each route does, `vercel.json`, and the pg_cron job in migration `067`. No migration and no protected file (`docs/RULES.md` §10).

## Known callers (checked 2026-11-21)

- Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Supported.
- The pg_cron job for `payout-retry` (migration `067`) sends `Authorization: Bearer <payout_retry_secret>`. Supported, as long as that value equals one of `CRON_SECRET`, `ONA_CRON_SECRET` or `JOB_EXPIRE_SECRET` on the host.
- No app code calls these routes, so the browser never does.
- Not checked: external schedulers such as cron-job.org. Any that send `?secret=` will start getting 401.

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON guide against the exact reviewed commit. Record concrete implementation/test evidence and live evidence separately. Never mark an unrun check passed.

## Boundaries and limitations

- Running these routes by hand under local `next dev` now needs `CRON_SECRET` in `.env.local` and the header on the request.
- The egress-ip alert email links to `/api/cron/egress-ip` "to verify". Opened in a browser, that link returns 401 whenever a secret is set, which is already the case on production today. The link is left as it is.
- `canRunMaintenance()` (the job sweeps, which also accept a signed-in user) is out of scope.

## Remaining work

Code and review:
- Independent review against the implementation commit.

External and deployment:
- Set `CRON_SECRET` on every Vercel deployment that runs crons. Without it, every cron route now returns 401.
- The pg_cron `payout_retry_secret` (in `ona_cron_config`) must equal a host cron secret. Check `cron.job_run_details` for `ona-payout-retry` after deploy.
- External schedulers such as cron-job.org must send the secret in a header, never in `?secret=`.
- After deploy, call each of the six routes without a secret and confirm 401.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the issue state and the same remaining code and external work. In the paired JSON guide, include `remainingWork: { "code": [], "external": [] }`, using explicit verified-none entries when appropriate.
