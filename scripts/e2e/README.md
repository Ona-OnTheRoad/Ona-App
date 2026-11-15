# End-to-end lifecycle test

Drives the real HTTP API through the whole marketplace journey: request a job, match a Repair Pro, negotiate, pay into escrow, trip, work, completion, release/payout, rating, chat, notifications, plus decline/re-route, cancel-and-refund, dispute and the authorization/validation negatives at each step.

It also runs a **read-only schema pre-flight** (section 0) that reports any SQL function or table the code needs but the database does not have. Run it before every deploy: a database that is behind the code fails here instead of in front of customers.

## WARNING: it writes to the Supabase project in `.env.local`

It creates test users with the service role. Everything it creates is tagged (`*@ona-e2e.invalid`, name prefix `E2E-TEST`) and removed by `cleanup.mjs`. It refuses to run without `E2E_CONFIRM_WRITES=yes`, and only talks to a local server.

## 1. Start a local server with every paid or outbound channel switched off

`next dev` loads `.env.local`, which has live SMS, email, push, Maps and payment keys. A process environment variable beats `.env.local`, so blank them:

```bash
export PAYMENT_PROVIDER=mock ALLOW_MOCK_PAYMENTS=true
export FLUTTERWAVE_SECRET_KEY= FLUTTERWAVE_PUBLIC_KEY= NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY= \
       FLUTTERWAVE_PLATFORM_SUBACCOUNT= FLUTTERWAVE_TRANSFER_PROXY_URL= FLUTTERWAVE_TRANSFER_PROXY_SECRET= \
       FLUTTERWAVE_WEBHOOK_SECRET_HASH= PAYSTACK_SECRET_KEY=
export AT_API_KEY= AT_USERNAME= AT_SENDER_ID= TERMII_API_KEY= TERMII_SENDER_ID= TERMII_BASE_URL=
export RESEND_API_KEY= RESEND_FROM_EMAIL=
export VAPID_PRIVATE_KEY= VAPID_PUBLIC_KEY= VAPID_SUBJECT=
export GOOGLE_MAPS_API_KEY= NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
export CRON_SECRET= ONA_CRON_SECRET= JOB_EXPIRE_SECRET=
export NEXT_PUBLIC_APP_URL=http://localhost:3201
npx next dev --port 3201
```

This matters because `resolveProvider()` picks Flutterwave whenever a key is present, even in development, so a payout for a test job would otherwise call the transfer API. The test itself aborts if the payment provider is not `mock`.

## 2. Run

```bash
E2E_CONFIRM_WRITES=yes BASE_URL=http://localhost:3201 node scripts/e2e/lifecycle.mjs
```

Results are also written to `reports/e2e-<run>.json`.

## 3. Clean up

```bash
node scripts/e2e/cleanup.mjs <runId>      # one run
node scripts/e2e/cleanup.mjs --dry        # show what would be removed
```

## How it stays out of the way of real users

- **Geography:** test users sit at open-ocean coordinates, so no real customer or Repair Pro can be inside the 5 km matching radius.
- **Pros are set offline when the run ends.**
- **Reserved email TLD** `.invalid` can never receive mail.
- The dispatcher skips accounts marked synthetic by `isSyntheticAccount`, so the repo's own seeder users cannot be used to test matching. These test accounts deliberately do not carry that marker.

## Not covered (time-based, or needs real providers)

Pairing timeout (144 s), negotiation expiry (20 min), unpaid-booking expiry, 6 h auto-release, the scheduled sweeps, real Flutterwave charges, webhooks and transfers, real SMS/email/push, and the browser UI. Those need a staging environment with real provider sandboxes.
