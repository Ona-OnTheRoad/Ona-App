# Payment confirmation plan

Written: 2026-10-07. Implemented locally on `feat/payment-confirmation`; see [implementation and setup](PAYMENT_CONFIRMATION_IMPLEMENTATION.md) for behavior, validation and remaining release checks.

## Resume context

- Working branch: `refactor/backend`, created from `origin/dev` at `03a745f`.
- Step 1 (protected client-write lockdown) was committed as `08cb5c7` and pushed.
- PR: https://github.com/Ona-OnTheRoad/Ona-App/pull/2 — base `dev`.
- Migration `supabase/migrations/20261004_077_lock_client_writes.sql` was applied to the dev Supabase project `ecmflahofeudjyoepcfk`. All six guard triggers and expected client table privileges were verified. Production was not modified.
- Step 1 validation: disposable PostgreSQL fixture passed; lint passed with existing warnings; typecheck passed; 94 Vitest files / 1,086 tests passed.
- Local app URL is `http://localhost:3100`. Leave port 3000 alone: another project uses it. Read current `.env.local` without printing secrets; the user has changed configuration and intends to restart the agent.
- `reports/` contains the engineer and architecture reviews and remains outside the step 1 commit.
- Verify current Git, configuration and PR state before resuming; do not assume the facts above are still current.

## Problem

Several backend paths can confirm a payment and mark a job booked:

1. `POST /api/payments/verify`.
2. Payment reconciliation while loading a job.
3. Verification during payment release.

The engineer review found inconsistent checks between those paths. The verify endpoint checks the amount but permits a zero provider amount and does not check currency. Other paths may accept provider success without checking the amount. The verify endpoint also accepts a client-supplied provider choice.

This risks accepting a successful transaction that does not match the stored payment obligation. Confirmation also depends on browser callbacks or job reads, so a customer can pay and close the app before Ona records it.

These are report findings to verify against current source, not claims of a demonstrated production incident. The reports reviewed older code and did not inspect the deployed database.

## Intended implementation

### 1. Trace all confirmation paths

Read the engineer and architecture reviews in `reports/`, then inspect current source and callers:

- `src/app/api/payments/verify/route.ts`.
- `src/lib/server/jobs/job-store/payments.ts`, including `reconcileJobPayment`, `releaseJobEscrow` and `markJobPaidFromReference`.
- `src/lib/server/jobs/job-store/reads.ts`.
- `src/lib/server/payments/providers.ts`.
- `src/lib/server/payments/escrow-store.ts`.
- Other callers that write paid/held escrow state or booked job state.

Record the checks, tables and side effects for each path. Distinguish job escrow from shop, Express and wallet ledgers; do not combine their lifecycles.

### 2. Establish one server confirmation operation

Create a shared server operation that:

- Loads the stored payment and derives its expected provider, reference, amount, currency and job association.
- Independently verifies the transaction with the stored provider.
- Validates provider success, amount, currency and transaction/reference association before accepting payment.
- Prevents client payloads from selecting the provider or overriding expected values.
- Returns explicit pending, rejected, confirmed or already-confirmed outcomes as appropriate to existing API contracts.
- Handles repeated confirmations safely without duplicate booking, notifications or other effects.

Define amount comparison from actual provider units and existing business requirements. Do not retain permissive zero-amount acceptance or invent a rounding tolerance without evidence. Keep mock behavior explicitly isolated from live-provider validation and governed by existing environment restrictions.

### 3. Route existing paths through the operation

Use the same validation for manual verification, reconciliation and verification during release. Preserve client response contracts where practical and eliminate alternate success-only confirmation paths.

Document any remaining persistence/concurrency limitations. A shared function alone does not make separate payment and job writes atomic.

### 4. Add an authenticated Flutterwave webhook

- Consult current official Flutterwave documentation for the configured integration's webhook verification contract before implementation.
- Verify the notification's signature/authentication before processing it, using a dedicated configured secret and fail-closed behavior.
- Treat the notification as a trigger to verify the transaction independently, not as proof of payment.
- Resolve the stored payment and invoke the shared confirmation operation.
- Handle duplicate, delayed and concurrent notifications safely.
- Document required configuration and dev testing without placing secrets in source or reports.

The webhook should allow confirmation to complete after the customer closes the app. Retain a controlled recovery/check-again path for missed or delayed delivery.

### 5. Validate correctness and compatibility

Test meaningful cases:

- Correct successful payment.
- Pending/failed provider transaction and provider outage.
- Underpayment, zero amount and wrong currency.
- Wrong reference, provider or job association.
- Forged or unauthenticated webhook.
- Duplicate webhook and repeated manual verification.
- Simultaneous webhook/manual/reconciliation attempts.
- Payment confirmed after the browser closes.
- Already-held/released payments and explicit mock-mode restrictions.

Run `npm run lint`, `npm run typecheck` and `npm run test`. Follow applicable anti-regression smoke checks for job/payment behavior. Report any live-flow verification that could not be performed; do not imply mocked tests prove deployed behavior.

## Scope and constraints

- Preserve pricing, commission, VAT, payout rules, deadline ownership and UI behavior.
- Follow `docs/HANDOFF.md`, `docs/RULES.md`, `docs/ANTI_REGRESSION.md` and applicable agent instructions.
- Read relevant guides in `node_modules/next/dist/docs/` before changing Next.js code.
- Protected job/payment logic requires compliance with the repository's approval and review rules. This saved plan is not itself authorization to deploy or change every protected behavior.
- Full transactional job/payment persistence, unattended scheduling improvements, and removal of reconciliation from ordinary reads are later steps. This work must not claim to solve them merely by sharing confirmation checks.
- Do not apply further database migrations or alter production configuration as part of saving this plan.

## Completion criteria

All identified job-escrow confirmation paths use the same stored-payment validation; a correctly authenticated webhook triggers independently verified confirmation; invalid payments cannot mark jobs booked; repeat/concurrent confirmations are covered by tests; required checks pass; configuration and remaining limitations are documented.
