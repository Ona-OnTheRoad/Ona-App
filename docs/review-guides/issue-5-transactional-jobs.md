# Issue 5: transactional job transitions and pure reads

## Goal

Make payment-backed job transitions atomic in PostgreSQL, durably record work that must survive process crashes, and remove payment/state repair from ordinary job reads only after an independent recovery worker is verified. Preserve payment validation, refund/terminal-state protections, Issue 4 compare-and-swap behavior, and all existing fee and assignment rules.

This addresses Issue 5 in the engineer report’s suggested work order. See [BACKEND_FIXES_STATUS.md](../BACKEND_FIXES_STATUS.md), [PAYMENT_CONFIRMATION_PLAN.md](../PAYMENT_CONFIRMATION_PLAN.md), and [PAYMENT_CONFIRMATION_IMPLEMENTATION.md](../PAYMENT_CONFIRMATION_IMPLEMENTATION.md).

## Proposed implementation plan

1. **Inventory and define transaction boundaries.** Trace every job/payment transition that spans tables, every read-time repair/reconciliation path, webhook retry behavior, and all emitted events/notifications/provider actions. Identify which effects must be atomic, which can be delivered after commit, and which external operations require idempotency/reconciliation. Do not change behavior during this inventory.
2. **Specify durable processing semantics.** Define inbox/outbox records, unique idempotency keys, statuses, retry/backoff/lease behavior, terminal/manual-recovery handling, retention, and service-role-only access. State explicitly that provider HTTP calls never run inside a database transaction.
3. **Add atomic database transitions.** Add a migration with narrowly scoped RPCs that lock/check payment and job state/version, atomically update the payment and job, and insert the corresponding domain event/outbox work in the same transaction. Return explicit outcomes for already-applied, stale/conflict, terminal-state, and invalid-association cases. Preserve Issue 4 `job_version` advancement.
4. **Persist inbound events and deliver effects durably.** Make webhook intake idempotently record verified/authenticated provider notifications before acknowledging them. Add an idempotent worker for inbox and outbox processing, with bounded retries and recoverable failures. Provider verification/refunds/transfers remain outside SQL transactions and use durable intent plus idempotency/reconciliation where supported.
5. **Move repair off ordinary reads.** Build and validate an independently invoked reconciliation worker for already-held payments, missing job transitions, and eligible expiry/recovery cases. Once it is proven to catch up after restarts and repeated failures, make `getJob` and list/read APIs observational: database reads and hydration only, no provider calls, writes, notifications, or state repair.
6. **Validate concurrency, failure and rollout.** Test duplicate/overlapping webhook deliveries, worker crashes/retries, stale versions, cancellation/refund races, outbox redelivery, and read purity against PostgreSQL. Document required scheduler cadence/secret, migration order, monitoring, rollback/recovery, and hosted evidence separately. Do not change production scheduler configuration without explicit rollout scope.

## Expected change areas

- `src/lib/server/payments/confirm-job-payment.ts` and `confirmation-store.ts` for verified payment orchestration and RPC result handling.
- `src/app/api/payments/webhooks/flutterwave/route.ts` and payment verification/recovery routes for durable intake and retry responses.
- `src/lib/server/jobs/job-store/reads.ts`, `payments.ts`, `recovery.ts`, and other read-time repair callers.
- New server modules for inbox/outbox persistence and bounded idempotent processing; the exact module split follows the inventory.
- A new Supabase migration for inbox/outbox tables, indexes, RLS/grants, transition RPCs and any lease/claim functions.
- Focused PostgreSQL fixtures and unit/API tests for transaction rollback, duplicate delivery, races and read purity.
- Review guide, backend status, and handoff/recovery documentation.

Do not assume this list is complete. Search every `service_requests`, `payments`, `job_events`, refund and provider side-effect writer before implementation. Preserve the Issue 4 migration and its version trigger.

## Review criteria

Use the paired [JSON checklist](issue-5-transactional-jobs.json). Review exact transaction boundaries and failure outcomes from persisted inbox item through database transition and outbox delivery. Keep local test evidence separate from hosted scheduler/runtime evidence.

## Boundaries and limitations

- Provider verification, transfer, and refund HTTP calls cannot participate in a PostgreSQL transaction. Persist intent and outcome around those calls; prevent duplicate external effects with provider idempotency where available and reconciliation where it is not.
- Outbox delivery is at least once. Consumers must be idempotent; the design must not claim exactly-once notification or provider behavior.
- Reads must remain safely recoverable until an unattended reconciler is deployed and shown to recover missed work. Issue 3 scheduler rollout is currently pending and is a dependency for removing repair-on-read in production.
- Issue 4 versioned writes remain the concurrency contract. Issue 6 owns broad operational observability; this issue still needs retry state and actionable processing outcomes.
- This scope is the job payment lifecycle. Shop, Express, wallet, and cashout aggregates need separate plans unless inventory proves a shared primitive is safe and the scope is approved.
- Existing held/refunded/terminal records may require a backfill or manual review. Do not silently rewrite historical financial state.

## Reviewer procedure

Review the exact implementation commit. Confirm each JSON requirement against SQL, caller behavior and automated evidence. Follow duplicate and failure cases through durable processing, including what happens when the app process exits immediately after database commit. Mark hosted scheduler behavior pending until measured in the intended environment.

## Current implementation status

Implementation was merged to `dev` in PR #5. The code routes payment booking through one database RPC, records authenticated Flutterwave notifications in a durable inbox, queues pending-payment reconciliation, writes booking events/outbox intent in the same transaction, and processes inbox/reconciliation/outbox plus job recovery through the authenticated minute worker. `getJob` and ordinary list reads no longer reconcile, expire, or repair records. Provider verification remains outside the transaction. The durable payment intent now fails closed when configured database persistence fails; process memory remains available only for isolated mock payments. Migration 080 was applied to the configured Supabase project and its tables, grants/RLS, RPC grants and version trigger were verified.

Local evidence so far: `npm test` passes (101 files, 1,200 tests); `npm run typecheck` passes; targeted ESLint over changed code passes with no errors; the scheduler client passes `node --check`; `git diff --check` passes. Migration 080 applied successfully to a disposable local PostgreSQL fixture. A forced outbox insert failure rolled back payment and job updates; a valid confirmation then returned `confirmed`, a duplicate returned `already_confirmed`, and draining the outbox created one event/two notifications exactly once. Applying the existing Issue 4 migration 079 to the fixture and booking another job confirmed that `job_version` advanced from 0 to 1. The fixture was deliberately separate from Supabase and does not replace an integration run against the complete deployed schema.

Remaining code/review work: complete an independent review against the merged commit; test full-schema migration reapplication, worker lease takeover/concurrency, crash/retry behavior, and operational handling; design queue retention/cleanup and an operator path for manual-review rows. Queue rows have bounded retry-to-manual-review transitions but no operator UI or retention job yet. The outbox delivers in-app notifications; push delivery remains outside this transaction and is not part of the atomic guarantee.

Remaining external work: verify unattended worker recovery with no browser after restart/provider outage, observe the deployed schedule and alerts, and confirm migration/runtime behavior in the intended hosted environment. The migration has been applied to the configured Supabase project, but this does not establish unattended operation. Record each result in the paired criteria before closing the issue.
