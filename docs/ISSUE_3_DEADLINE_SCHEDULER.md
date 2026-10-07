# Issue 3: unattended deadline processing

Work branch: `feat/unattended-deadline-sweeps`, based on payment confirmation commit `dbd0336`. Issue numbers refer to the report fix order. Review criteria: [Issue 3 guide](review-guides/issue-3-deadline-scheduler.md).

## Implementation

`GET` or `POST /api/jobs/deadline-sweep` processes pairing and overdue armed negotiation in independent batches of up to 25 jobs. It requires a configured server secret (`CRON_SECRET`, `JOB_EXPIRE_SECRET`, or `ONA_CRON_SECRET`) from the Authorization or supported custom header. No anonymous local bypass, browser-user authorization, URL secret or body secret is accepted on this scheduler endpoint.

The shared secret checker uses constant-time equality. Existing `/api/jobs/pairing-sweep` and `/api/jobs/expire-stale` retain authenticated browser recovery. Every expire-stale operation now follows authorization, including dispatch and payout processing. Client callers already send authentication; no cron secret is added to browser code.

The minute endpoint intentionally does not run the broad expire-stale refund/cancellation/payout maintenance operations. Existing daily cron and authenticated recovery retain those operations. Second-pro scheduled dispatch and other deadline families remain on their existing maintenance cadence; this change does not claim unattended one-minute execution for them.

Negotiations are selected directly from durable `service_requests` where `flow_status = negotiating` and `negotiate_ends_at` is overdue, ordered by deadline then ID. Future and terminal jobs cannot fill the batch. Existing `isNegotiationTimerArmed` and `EXPIRE_NEGOTIATION` rules govern expiry. A narrow conditional update checks flow status, exact deadline and `updated_at`, preserves unrelated data, and clears terminal pairing fields. Ordinary read-triggered or explicit negotiation expiry uses the same conditional operation.

Only the durable expiry winner writes a best-effort event and the existing pro notification. The separate event/notification writes are not transactional: a crash can lose them. No new financial effect occurs in negotiation expiry.

Unarmed pairing fallback candidates are also limited to 25 per run, selected oldest first and conditionally armed only if still unchanged. Batch saturation is reported. Pairing sweeps preserve shared 144-second deadlines and existing ranking, radius and offer rules. Timeout settlement now uses the service-role-only `timeout_pairing_request` transaction: it locks and checks the observed stage, deadline, pro and update timestamp, then changes the job, old-pro queue/reservation and matching owned callout together. Same-stage rearming or confirmation can invalidate the entire attempt without destructive effects. A settlement failure rolls back every effect. Unknown/different-pro callout ownership is never voided; fee values are preserved. Next-pro search runs afterward with a persisted continuation deadline using the existing four-second empty-search hold; if continuation fails, a later sweep can resume. Provider-candidate/queue read failures must not be interpreted as an empty pool. Sweep failures propagate to a retryable response rather than silently reporting success.

## Migration and overlap

`supabase/migrations/20261007_078_job_sweep_leases.sql` adds service-role-only sweep leases and ordered negotiation/unarmed-pairing indexes. Atomic claim/upsert serializes pairing sweeps across browser recovery, the scheduler, and all server instances using that database. Negotiation batches have a separate scope. Lease ownership is a random UUID; only that owner can release it. The same migration supplies the atomic pairing-timeout function; existing pairing, reservation and callout migrations must be installed. A crash leaves a lease that becomes reclaimable after 120 seconds. Sweep route maximum duration is 60 seconds.

Missing migration, unavailable database or a busy scope fails closed. The minute route attempts both scopes and returns 503 if either is unavailable, including contention, so a scheduler can retry. Completed work in the other scope is not undone. Per-job conditional writes remain necessary: the lease does not lock out ordinary accept/open/cancel operations.

Apply the migration to dev **before deploying this code**, verify permissions and functions, then configure the scheduler. No hosted migration has been applied by this task. The local fixture validates migration behavior, not the full deployed schema or hosted grants.

## External scheduler setup

The current checked-in Vercel crons remain daily to preserve the documented hosting setup. [Vercel scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) restrict Hobby cron frequency; one-minute operation requires a supported external scheduler or Pro scheduling. An external HTTPS scheduler is the prepared default; an existing schedule/account and hosting plan have not been inspected.

1. Deploy the reviewed build to dev after applying the migration and configuring a dedicated random server secret. Store its value only in deployment/scheduler secret settings.
2. Configure one job against `https://<dev-host>/api/jobs/deadline-sweep`, method POST (GET is also supported), cadence `* * * * *`, header `Authorization: Bearer <configured-secret>`.
3. Enable failed-run alerts and inspect response status/body. 401 indicates invalid configuration; 503 indicates failed or busy work and requires retry/investigation. Do not disable the job permanently after one contention response. Keep one schedule per database, even when frontend/backend hosts share it.
4. Use a scheduler timeout compatible with the endpoint's measured duration. [cron-job.org documents a 30-second timeout](https://cron-job.org/en/faq/); the route's maximum is 60 seconds. Test duration under representative load and reduce batch size or select an appropriate scheduler if requests exceed its timeout. Bounded row count is not a runtime guarantee.
5. Verify timestamped run history and route logs show both scopes completing. A configured cron expression does not establish actual delivery.
6. Enable production scheduling only after the dev evidence and protected-flow review are complete. Production secret/configuration is a separate rollout.

## Portable scheduler client

`npm run jobs:deadline-sweep` invokes one authenticated deadline run using environment variables. `npm run jobs:deadline-sweep -- --watch` runs sequential minute ticks on an always-on Node host; supervise that process and its logs. Set `DEADLINE_SWEEP_BASE_URL` to the deployed HTTPS origin (default local port 3100) and the configured server secret in that host’s secret environment. For local dev, `node --env-file=.env.local scripts/run-deadline-sweep.mjs --watch` loads local configuration without printing secrets.

The client rejects credential/query-bearing URLs, refuses remote plain HTTP and redirects, times requests out at 55 seconds, retries on the next watch tick and never overlaps its own requests. It requires both scope outcomes to be completed before reporting success. It does not create an always-on host, restart itself, configure hosted secrets or replace the database lease. Closing its terminal stops local scheduling; a supervised host or configured external scheduler is required for unattended deployed operation.

## Acceptance and operations

With no browser open: create a pairing request and let its stored deadline pass; observe the next pro/terminal outcome through server runs. Create an armed negotiation, let its existing 20-minute deadline pass, and observe expired status, cleared pairing fields and one history entry. Run overlapping/repeated requests; confirm no duplicate expiry transition. Also test future/unarmed jobs, rearming, cancellation/agreement races and absent/incorrect secrets.

Inject a dev database failure, observe a 503/alert, restore access, and verify catch-up. Simulate a crashed lease and verify recovery after 120 seconds. Watch oldest overdue records and batch saturation: a single one-minute tick may not drain a backlog. Scheduling adds tick delay and provider/DB latency; it does not enforce exact wall-clock transitions.

Operational logs contain run timestamps, scope outcomes/counts and sanitized failures, never scheduler secrets or provider payloads. Logs and the scheduler's own history are not a durable workflow inbox/outbox. If lease release fails, inspect the log and allow expiry before retry. A stale owner cannot delete a newer lease.

Rollback: disable the new external schedule, retain migration/lease functions while this build is still deployed, and roll back application code deliberately. Existing authenticated recovery and daily maintenance remain. Do not drop the lease table while workers may be active.

## Remaining limits

- No hosted configuration, live delivery, load verification or authenticated browser smoke is established by unit tests/local PostgreSQL fixtures.
- Other job writers still have unconditional/degraded persistence; a lease and CAS do not make the entire aggregate transactional (Issues 4 and 5).
- The timeout settlement phase is transactional, but candidate advancement and other manual pairing steps still span queue, reservation, callout and job records; not every effect is atomic. This work does not certify every manual pairing operation against all concurrent clients.
- A lease assumes worker runtime stays below its TTL. The HTTP routes are capped at 60 seconds; external consumers calling the exported sweep directly must also bound their runtime.
- Best-effort expiry event/notification can be lost after a durable winner. Durable outbox and broader observability remain later work.
- One-minute scheduler availability and configured secret rotation require an operational owner. A missed run increases deadline lag until recovery.

## Working-tree validation

- `npm run lint`: passed, zero errors; 167 existing warnings.
- `npm run typecheck`: passed.
- `npm test`: 101 files / 1,209 tests passed, including 50 added cases for Issue 3.
- Local PostgreSQL fixture: finalized migration applied twice; concurrent claim, owner isolation, independent scopes, expiry recovery and role-permission checks passed. Atomic timeout checks passed for concurrent winners, rearm/confirmation blocked behind row locks, quote ownership, partial-open cleanup, forced rollback and successful retry.
- `git diff --check`: passed.
- Hosted migration/scheduler activation, representative-load timing and authenticated browser smoke remain pending. Criteria retain pending status until formal review against a commit and required deployment evidence.

For migration regression testing, use a **fresh disposable local database** and run `SWEEP_TEST_DATABASE_URL=postgresql://<local-user>@127.0.0.1:<test-port>/<empty-test-db> node scripts/verify-job-sweep-leases.mjs`. It creates a minimal fixture schema and will refuse an existing service_requests/lease table. It does not load application environment credentials and must not be used against an application database.

## Independent review fixes

A separate reviewer identified timeout settlement before ownership and ignored radius-expansion errors. Both were addressed before commit: destructive timeout effects now share the conditional transaction, and failed radius writes propagate without exhausting the search. Regression tests inject these races and failures; the PostgreSQL fixture tests rollback and client-vs-timeout locking with actual transactions. Full aggregate transaction work remains outside this scoped fix.

The independent reviewer rechecked both fixes and found no new blocking defects in those paths. This review does not certify hosted rollout or all manual/candidate aggregate races.
