# Feature review guide: lock down and fix the pg_cron payout-retry job

## Goal

Migration `067` drives `/api/payments/payout-retry` from the database (pg_cron + pg_net, every 10 minutes), because Vercel Hobby crons run only once a day. It has three defects:

1. **Anyone can run its functions.** `set_cron_secret(text,text)`, `install_payout_retry_cron()` and `payout_retry_cron_status()` are `security definer` and never revoked, so `anon` and `authenticated` keep Postgres's default `EXECUTE`. On 2026-11-21 an anon-key RPC call to `payout_retry_cron_status()` succeeded on the dev Supabase project. That means anyone could overwrite `payout_retry_secret` (silently stopping payout retries), overwrite `egress_ip_last_alerted`, or reinstall the job. The write functions were not called, since the test itself would change data.
2. **The secret goes out as a query parameter, not a header.** The job calls `net.http_post(url, '{}', jsonb_build_object('Authorization', …))` with positional arguments. In pg_net's signature `(url, body, params, headers, timeout_milliseconds)` the third argument is `params`, so the bearer token ends up in the URL query string: the request carries no `Authorization` header and the secret lands in access logs. Since PR #107 the route rejects that with 401. To be confirmed in migration CI, which has pg_net.
3. **The host is hard-coded** to `https://336699.vercel.app`. The current dev host is `https://ona-dev-app.vercel.app`, and every database that installs the job calls the same fixed URL.

Agreed plan (approved in conversation, 2026-11-21; dev host `https://ona-dev-app.vercel.app`):

1. New migration `supabase/migrations/20261121_087_pg_cron_payout_lockdown.sql`:
   - `revoke all … from public, anon, authenticated` and `grant execute … to service_role` on all three functions. Also on `pairing_sweep()` when it exists (migration `047`, also `security definer`).
   - Redefine `install_payout_retry_cron()`:
     - It requires a `payout_retry_url` row in `ona_cron_config`: an `https://` origin with no path, query or credentials. Without it, it returns `{ ok: false, reason: "needs_url" }`. It still returns `needs_secret` when the secret is missing.
     - The scheduled command reads both the URL and the secret from `ona_cron_config` on every run, so changing the host or rotating the secret needs no reinstall.
     - It calls `net.http_post` with **named** arguments: `url := …`, `body := '{}'::jsonb`, `headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret)`.
   - Redefine `payout_retry_cron_status()` to also report whether a URL and a secret are configured, plus the URL itself. It never returns the secret.
   - Remove the old job: always `cron.unschedule('ona-payout-retry')` when it exists, because it can't authenticate. Then reinstall only if both the URL and the secret are configured.
   - Every step guarded so the migration still applies without pg_cron or pg_net, as `067` does.
2. `scripts/migration-ci-assertions.sql`:
   - Add the three function signatures to the RPC privilege check.
   - Behaviour checks: with no config, install returns `needs_url`. With the URL and a secret seeded, it schedules `ona-payout-retry`, and the command contains `headers :=`, contains no hard-coded host, and doesn't contain the secret. A non-https or path-bearing URL is refused.
3. Docs:
   - A "pg_cron jobs" section in `docs/VERCEL_DEPLOY.md`: enable the extensions, seed `payout_retry_secret` (same value as Vercel `CRON_SECRET`) and `payout_retry_url`, install, verify through `cron.job`, `cron.job_run_details` and `net._http_response`, rotate, unschedule.
   - `docs/MUTATION_INVENTORY.md` row for `payout-retry`.
   - `docs/BACKEND_FIXES_STATUS.md`.

## Expected change areas

- New migration `20261121_087_pg_cron_payout_lockdown.sql`, which also adds `public.is_valid_cron_origin(text)` (service_role only).
- `scripts/migration-ci-assertions.sql`.
- `docs/VERCEL_DEPLOY.md`, `docs/MUTATION_INVENTORY.md`, `docs/BACKEND_FIXES_STATUS.md`.

No application code changes: the route already requires the header (PR #107). The `ona_cron_config` table is unchanged; its RLS already limits it to `service_role`. No protected file (`docs/RULES.md` §10).

## Pairing sweep (resolved)

`ona-pairing-sweep` and `pairing_sweep()` (migration `047`) were already retired by migration `048`, which unschedules the job and drops the function. 087 revokes client execute on `pairing_sweep()` only if the function exists, so on a normal replay the revoke does nothing.

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON guide against the exact reviewed commit. Record concrete implementation/test evidence and live evidence separately. Never mark an unrun check passed.

## Boundaries and limitations

- Applying the migration to a hosted project, and seeding the URL and secret there, is a manual step for the project owner.
- A database whose job is currently installed loses it on migrate until the URL is seeded. That job couldn't authenticate anyway (defect 2).
- `cron.job_run_details` only shows that the SQL ran. The HTTP status is in `net._http_response`, which pg_net prunes on its own after a few hours.

## Remaining work

Code and review:
- Independent review against the implementation commit.
- GitHub "Fresh Supabase migrations" run with the real pg_cron and pg_net, which confirms the `net.http_post` argument order, the privileges and the install behaviour.

External and deployment:
- Apply migration 087 to the dev Supabase project.
- Enable `pg_cron` and `pg_net`, seed `payout_retry_secret` (the same value as `CRON_SECRET` on `ona-dev-app`) and `payout_retry_url=https://ona-dev-app.vercel.app`, then run `install_payout_retry_cron()`.
- Confirm `net._http_response` shows 200 from payout-retry, and that an anon-key RPC to the cron functions is refused.
- Production: the same steps with the production host and secret, as a separate rollout.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the issue state and the same remaining code and external work. In the paired JSON guide, include `remainingWork: { "code": [], "external": [] }`, using explicit verified-none entries when appropriate.
