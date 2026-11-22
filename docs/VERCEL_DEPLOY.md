# Ona — Vercel deploy

Ona is a **single Next.js codebase** (public phone UI + `/admin` + all `/api/*` routes) deployed as **one project**; staff open `/admin` on the same host as the app.

## Deploy

Deployment is automatic through the GitHub → Vercel integration: merging to the connected branch deploys it, and every pull request gets a preview. There are no deploy scripts in this repo, so do not run `vercel` from a laptop for releases.

To work against a project's settings locally, copy the values from **Vercel → Project → Settings → Environment Variables** into `.env.local` (never commit it).

## Environment

Set variables in **Vercel → Project → Settings → Environment Variables** (Production and Preview). **`.env.example` is the complete list** with required and optional variables marked; `docs/HANDOFF_KEYS.md` covers the payment keys and the static-IP payout proxy.

Minimum for a working deploy: Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, the Flutterwave keys, `CRON_SECRET` and `ADMIN_SENSITIVE_PASSWORD`. Both projects need the service-role key.

**Before going live with real users:** remove `OTP_DEMO_MODE` **and** `NEXT_PUBLIC_OTP_DEMO_MODE` (or set both to `false`) once real SMS and email delivery are configured. The demo OTP is accepted in production only while one of them is exactly `true` (see `src/lib/auth/demo-otp.ts`); while neither is `true`, OTP login needs a working SMS provider (phone) and `RESEND_API_KEY` (email).

## Cron jobs

Defined in `vercel.json`. Vercel calls each route with `Authorization: Bearer $CRON_SECRET`. Every cron route checks it with `hasSchedulerSecret()`: the secret must arrive in a header (`Authorization: Bearer` or `x-cron-secret`), never in `?secret=`, and when no secret is configured the route returns 401. Set `CRON_SECRET` on every deployment that runs crons. Any other scheduler (cron-job.org, the pg_cron payout job) must send the same value in a header.

| Path | Schedule (UTC) |
|------|----------------|
| `/api/jobs/expire-stale` | daily 00:00 |
| `/api/jobs/pairing-sweep` | daily 00:05 |
| `/api/cron/notification-retry` | daily 00:10 |
| `/api/cron/prune-idempotent-ops` | daily 00:20 (deletes `idempotent_ops` rows older than 7 days) |
| `/api/payments/payout-retry` | daily 08:00 |
| `/api/cron/egress-ip` | daily 08:30 |
| `/api/cron/analytics-rollup` | daily 08:45 |

These are daily because of the Vercel **Hobby** plan limit. Deadlines (pairing, negotiation, pay window) are server-owned; the client sweep keeps them near-real-time between cron runs. Faster server-side sweeps need a Pro plan or an external scheduler.

## pg_cron jobs (Supabase)

Vercel Hobby crons run once a day, so payout retry also runs from the database every 10 minutes: pg_cron schedules it and pg_net sends the HTTP request. The job `ona-payout-retry` (migrations `067` and `087`) calls `POST <payout_retry_url>/api/payments/payout-retry` with `Authorization: Bearer <payout_retry_secret>`. The route checks that header with `hasSchedulerSecret()`, like every other cron route.

Set up once per Supabase project, in the SQL editor:

1. Enable the extensions: Dashboard → Database → Extensions → `pg_cron` and `pg_net`.
2. Store the secret. Use the same value as `CRON_SECRET` on the host the job calls:
   ```sql
   select public.set_cron_secret('payout_retry_secret', '<CRON_SECRET>');
   ```
3. Store the host. Only an `https://` origin with no path is accepted; for dev, `https://ona-dev-app.vercel.app`:
   ```sql
   select public.set_cron_secret('payout_retry_url', 'https://ona-dev-app.vercel.app');
   ```
4. Install the job. It returns `{"ok": true, ...}`, or a `reason`: `needs_url`, `needs_secret`, `needs_pg_cron` or `needs_pg_net`.
   ```sql
   select public.install_payout_retry_cron();
   ```
5. Verify after the next 10-minute mark:
   ```sql
   select public.payout_retry_cron_status();   -- jobs, URL, whether a secret is set (never the secret)
   select jobname, status, start_time from cron.job_run_details order by start_time desc limit 5;
   select status_code, left(content::text, 200), created from net._http_response order by created desc limit 5;
   ```
   `cron.job_run_details` only shows that the SQL ran; the HTTP result is in `net._http_response`. A `401` means the stored secret doesn't match the host's `CRON_SECRET`.

The URL and the secret are read on every run. To rotate the secret or change the host, run step 2 or 3 again; there is no need to reinstall. To stop the job: `select cron.unschedule('ona-payout-retry');`.

These functions are callable only by `service_role` and the SQL editor, not by the anon key or signed-in users. Keep **one** job per database, and point each database only at the host that uses it.

## Issue 3 minute deadline scheduler

The dedicated `/api/jobs/deadline-sweep` endpoint requires a configured server secret and migration `20261007_078_job_sweep_leases.sql`. Prepare an external one-minute HTTPS schedule for the current hosting setup; the daily entries above remain unchanged. See [Issue 3 setup, acceptance and rollback](ISSUE_3_DEADLINE_SCHEDULER.md). This repository change does not configure a hosted scheduler.

## After deploy

1. Open https://ona-mi.vercel.app.
2. Open `/admin/login` on either host.
3. Restrict the Google Maps key to the production domains.
4. If payouts fail, check that the payout-proxy egress IP is whitelisted in Flutterwave (`tools/flw-payout-proxy/README.md`).
5. For a clean test slate, see `docs/CLEAN_START_TESTING.md`.

## Local ports

| Surface | URL | Command |
|---------|-----|---------|
| Public Ona | http://localhost:3000 | `npm run dev` |
| Admin (same codebase) | http://localhost:3000/admin | `npm run dev` |

If a deployment shows **"This deployment is temporarily paused"**, that is a Vercel account or usage block, not an app error.
