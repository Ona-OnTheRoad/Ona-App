# Ona — Vercel deploy

Ona is a **single Next.js codebase** (public phone UI + `/admin` + all `/api/*` routes) deployed to **two Vercel projects** from the same repo:

| Project | Host | Role |
|---------|------|------|
| `ona-mi` | https://ona-mi.vercel.app | Public consumer app (staff can also use `/admin` here) |
| `ona-backend` | https://ona-backend.vercel.app | Admin / control centre + APIs |

On backend hostnames `src/middleware.ts` redirects every non-`/admin`, non-`/api` request to `/admin`, so the consumer phone shell never loads there. Local admin dev uses port 4500.

## Deploy

Log in once, link the repo, and deploy with the repo scripts (they pass the project explicitly):

```bash
npm run vercel:login
npm run vercel:link          # link this checkout to a project

npm run deploy:frontend      # vercel --prod --yes --project ona-mi
npm run deploy:backend       # vercel --prod --yes --project ona-backend
npm run deploy:both          # backend first, then frontend
```

Pull a project's environment into a local file (never commit it):

```bash
npm run vercel:env           # writes .env.vercel.local
```

## Environment

Set variables in **Vercel → Project → Settings → Environment Variables** (Production and Preview). **`.env.example` is the complete list** with required and optional variables marked; `docs/HANDOFF_KEYS.md` covers the payment keys and the static-IP payout proxy.

Minimum for a working deploy: Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, the Flutterwave keys, `CRON_SECRET` and `ADMIN_SENSITIVE_PASSWORD`. Both projects need the service-role key.

**Before going live with real users:** set `OTP_DEMO_MODE=false` **and** `NEXT_PUBLIC_OTP_DEMO_MODE=false` once real SMS is configured. The demo OTP is accepted in production unless both are exactly `false` (see `src/lib/auth/demo-otp.ts`).

## Cron jobs

Defined in `vercel.json` and sent to the `/api/...` routes with the cron secret:

| Path | Schedule (UTC) |
|------|----------------|
| `/api/jobs/expire-stale` | daily 00:00 |
| `/api/jobs/pairing-sweep` | daily 00:05 |
| `/api/cron/notification-retry` | daily 00:10 |
| `/api/payments/payout-retry` | daily 08:00 |
| `/api/cron/egress-ip` | daily 08:30 |
| `/api/cron/analytics-rollup` | daily 08:45 |

These are daily because of the Vercel **Hobby** plan limit. Deadlines (pairing, negotiation, pay window) are server-owned; the client sweep keeps them near-real-time between cron runs. Faster server-side sweeps need a Pro plan or an external scheduler.

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
| Admin (same codebase) | http://localhost:4500/admin | `npm run dev:admin` |

If a deployment shows **"This deployment is temporarily paused"**, that is a Vercel account or usage block, not an app error.
