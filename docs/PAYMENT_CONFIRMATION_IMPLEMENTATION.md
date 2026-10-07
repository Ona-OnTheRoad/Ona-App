# Job escrow payment confirmation

Implemented on `feat/payment-confirmation`, based on `origin/dev` (`03a745f`).

## Confirmation paths

| Entry point | Validation / persistence | Effects |
| --- | --- | --- |
| `POST /api/payments/verify` | `confirmJobPayment`; authenticated customer ownership; exact reference or stored job payment | Existing payment/job/receipt response; provider and transaction ID callback hints are ignored |
| `reconcileJobPayment`, called by job reads | Same operation, resolving the stored job payment | Repairs held payment → booked job; preserves check-again recovery |
| `releaseJobEscrow` | Same operation before payout | Existing payout settlement operation runs only after accepted confirmation |
| `markJobPaidFromReference` | Compatibility wrapper around the same operation | Cannot independently mark unverified payments held |
| `mockPayJob` | Same operation, local mock provider only | Existing mock pricing; deployed runtimes refuse mock confirmation |
| `POST /api/payments/webhooks/flutterwave` | Authenticated v3 notification → same operation with stored Flutterwave provider required | Confirms without an open browser; notification fields never prove payment |

Job escrow uses `payments` and `service_requests`, with a status entry in `job_events` for the booking write winner. Shop (`shop_payments`), Express (`ona_express_payments`) and wallet ledgers retain their separate lifecycles. Provider verification outside job escrow retains its existing provider selection; job escrow opts into strict stored-provider verification.

Live confirmation requires a configured database and the stored provider's credentials. It never substitutes another provider or falls back to a process-local database record after a configured database error. Payment lookups are exact: a supplied reference cannot fall back to a different reference or job.

Flutterwave v3 returns `amount` in major currency units; the adapter converts it to integer minor units using an exact decimal parser; fractional minor units, malformed amounts and unsafe integers are rejected rather than rounded. Paystack returns minor units directly. The verified amount must be positive and equal the stored integer amount; verified currency and transaction reference must match exactly. This follows the existing checkout instruction to transfer the exact amount. There is no one-naira tolerance and no live zero-amount exception. Mock amounts are isolated behind the stored `mock` provider and existing deployed-runtime prohibition.

Already funded states (`held`, `release_pending`, `pending_settlement`, `released`) are trusted as persisted confirmations; they are not reverified or reset. They still require the correct payment/job/party association. Existing historical held rows are not retroactively audited by this change. Refunded payments cannot book a job. Provider failure leaves the obligation retryable rather than permanently failing it.

## Flutterwave setup

The integration uses v3 (`/v3/charges`, `/v3/payments`, `/v3/transactions/verify_by_reference`). Flutterwave's [v3 webhook documentation](https://developer.flutterwave.com/docs/webhooks) specifies comparing the `verif-hash` header with the dashboard secret hash. Its [v4 webhook contract](https://developer.flutterwave.com/v4.0/docs/webhooks) instead uses HMAC-SHA256 and `flutterwave-signature`; this endpoint intentionally implements the configured v3 contract.

1. Generate a dedicated random notification secret. Set `FLUTTERWAVE_WEBHOOK_SECRET_HASH` on the application server; do not reuse the API key or payout-proxy secret.
2. In the Flutterwave dashboard for the same test/live account as `FLUTTERWAVE_SECRET_KEY`, configure that same secret hash and the HTTPS URL `https://<app-host>/api/payments/webhooks/flutterwave`.
3. Enable webhook retries. The v3 documentation describes three retries at 30-minute intervals after a non-200 response and a 60-second request timeout. Provider fetches here have a 15-second timeout.
4. Missing or invalid authentication returns 401 before parsing or accessing payments. Malformed charge events return 400. Unrelated events return 200 without touching any ledger.
5. Authenticated `charge.completed` events resolve `data.tx_ref` and independently query Flutterwave. Pending verification, checkout association still being saved, unknown payment rows and database/provider outages return 503 to request retry. Permanent mismatches are acknowledged with a rejected outcome and never book the job.

## Dev testing and recovery

Run `npm run lint`, `npm run typecheck`, and `npm run test`. Focused tests live in `src/lib/server/payments/__tests__/confirm-job-payment.test.ts`, `confirmation-store.test.ts`, and `stored-provider-verification.test.ts`.

For live dev verification, use Flutterwave **test** credentials and a dedicated test webhook secret. Start the app on port **3100**, expose that port through your approved HTTPS dev tunnel, and configure the test dashboard URL. Create a fresh agreed job through the app, open its bank-transfer checkout, complete the exact test payment, then close the browser before confirmation. Verify that the payment becomes held and the job becomes booked through the webhook. Resend the notification and use Check again: neither should add another booking history/event. Exercise delayed delivery and an unauthenticated POST as well. A local fabricated successful payload cannot confirm an unpaid real-provider transaction.

The existing Check again/manual verification and reconciliation on job reads remain recovery paths for missed notifications. A cancelled-job payment whose association still matches can be independently verified and recorded as held money, but cannot resurrect the terminal job. A superseded payment whose reference differs from the current job checkout is rejected before provider verification. These association/terminal-job outcomes require operator review of the payment and provider transaction before refund or correction. Do not create another payout to recover a collection.

## Concurrency and remaining limits

- In-process identical requests share an in-flight operation. Different entry points/workers are protected by conditional database updates against the payment/job `updated_at`, payment escrow state, and job `flow_status = agreed`.
- A booking winner writes one history transition and one best-effort status event. Concurrent confirmation losers reload the durable job; they never perform an unconditional fallback write. Booking has no notification effects to duplicate.
- Confirmation never regresses a concurrent release/refund observed by its conditional payment write. It bypasses the ordinary job read cache when a database is configured.
- **Payment and job writes are separate operations, not a transaction.** A held payment can outlive a failed booking write; another confirmation can repair it. A cancellation or refund can still occur between the payment write and job write. Unconditional writes in other job/checkout/refund workflows can still race with confirmation, in other parts of the aggregate. Checkout binding now conditionally updates only the unchanged agreed job, and early notifications request retry until the reference is bound. Full aggregate transactions and broader concurrency fixes remain later work.
- A crash/event insert failure after the winning job update can lose the optional event record. There is no durable notification inbox, outbox, or unattended reconciliation queue in this change. Provider webhook retries and controlled recovery remain necessary.
- No database migration, hosted configuration change or deployment is included. Human review is required before merging protected job/payment changes. Browser Call/Chat/navigation and negotiation smoke checks, plus real provider delivery, remain pre-merge verification; automated tests do not establish deployed behavior.

## Review hardening

Manual verification now requires the authenticated payment customer, and bank-transfer callers attach authentication. Strict verification rejects undocumented success aliases and fractional minor amounts. Confirmation checks the obligation returned after a conditional hold; released funds cannot book an agreed job. Checkout verifies its stored intent before exposing the session. Booking and checkout binding write only their own fields, preserving unrelated job data. Optional event failure cannot undo or misreport a durable booking.

## Validation result

- `npm run lint`: passed, zero errors; 167 existing warnings.
- `npm run typecheck`: passed.
- `npm run test`: 97 files / 1,159 tests passed, including 73 confirmation/provider/persistence cases.
- `git diff --check`: passed.
- Live Flutterwave test-account delivery and authenticated browser smoke checks were not run. No app was listening on port 3100 during the checks, and no test webhook secret or public webhook delivery configuration was changed.

## Report follow-up

This is Issue 2 in the engineer report’s suggested fix order. See [backend fixes status](BACKEND_FIXES_STATUS.md) for its open release checks, limitations assigned to later fixes, and the next task: Issue 3, unattended pairing/negotiation scheduling.
