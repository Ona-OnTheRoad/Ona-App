# Backend report fixes: status and next work

Updated: 2026-10-07. Issue numbers below refer to the engineer report’s **Suggested order of work**, not GitHub issues. Sources: `reports/Ona-Backend-Engineer-Review.html` §5 and `reports/Ona-Backend-Architecture-Review.html` §15. The reports are static reviews; deployed behavior must be verified separately.

| Issue | Work | Current status |
| --- | --- | --- |
| 1 | Lock down protected client writes and use the transition API | Prior work committed as `08cb5c7`; migration 077 was verified on dev. Current source audit and production rollout evidence remain pending. See [Issue 1 remaining work](review-guides/issue-1-protected-client-writes.md). |
| 2 | Authenticated Flutterwave webhook and shared payment confirmation | Implemented and reviewed on `feat/payment-confirmation`; provider/browser release checks remain. See [Issue 2 remaining work](review-guides/issue-2-payment-confirmation.md) and detailed checks below. |
| 3 | Server scheduler for pairing and negotiation expiry | Independently reviewed on `feat/unattended-deadline-sweeps`; hosted migration, scheduler activation and unattended evidence remain pending. See [Issue 3 guide](review-guides/issue-3-deadline-scheduler.md). |
| 4 | Conditional writes throughout jobs; remove degraded persistence and memory authority | Merged to `dev` in PR #3; automated checks passed and migration 079 applied to the configured Supabase project. Formal code review, isolated migration verification and runtime checks remain pending. See [Issue 4 guide](review-guides/issue-4-job-persistence.md). |
| 5 | Transactional job transitions and pure reads | Merged to `dev` in PR #5; migration 080 was applied to the configured Supabase project. Independent review, unattended worker evidence, operator handling and retention work remain pending. See [Issue 5 guide](review-guides/issue-5-transactional-jobs.md). |
| 6 | Structured logging and error visibility | Merged to `dev` in PR #6; request IDs, JSON server logging, safer 5xx responses, and payment/job API coverage are implemented locally. Tests, typecheck and lint pass; lower-level service coverage and hosted log evidence remain pending. See [Issue 6 guide](review-guides/issue-6-structured-observability.md). |
| 7 | Migration CI, distributed rate limiting and server-only guards | Committed in PR #7 for `dev`; all four CI jobs passed on `30fa6b8`: isolated full-history migration CI, atomic Redis limiter and deployed failure handling, server-only boundaries and shared DTO/helper moves. Local gates are recorded in the [Issue 7 guide](review-guides/issue-7-backend-hygiene.md); all 83 fresh migrations and schema/role assertions pass; real Redis integration, formal review and hosted rollout remain pending. |

## Remaining work ledger

Keep this ledger current for every report issue, including issues whose main code change is merged or described as implemented. “Code” includes unfinished implementation, regression coverage, independent review, migration verification and code-level rollout preparation. “External” includes hosted secrets/configuration, deployment, live service behavior, operational monitoring and ownership. A completed fix is not presented as fully closed while required items remain.

| Issue | Remaining code / review work | Remaining external / operational work |
| --- | --- | --- |
| 1 | Confirm the Issue 1 acceptance criteria and current branch contents against the exact reviewed commit; update this row if code gaps remain. | Production rollout of the Issue 1 migration/change is not established; verify the target environment and record evidence. |
| 2 | Issue 4/5/7 dependencies are tracked separately below; no additional Issue 2 code change is currently identified. | Configure test webhook and retries; complete browser-closed test payment, delayed/outage recovery, browser smoke checks, and historical held-payment review as detailed above. |
| 3 | Complete formal review against a commit; verify migration/permissions on an isolated full schema; review remaining multi-row/manual pairing races and notification durability. | Apply/verify migration in target environment, activate supported minute scheduler with secret, then record no-browser catch-up, overlap/restart, load and alert evidence. |
| 4 | Complete independent writer coverage review, isolated migration reapplication and protected-flow review; any unguarded SQL/direct writer found must be fixed or explicitly deferred. | Migration 079 was applied to the configured Supabase project; verify the intended hosted runtime and record observed CAS conflict behavior. |
| 5 | Finish full-schema migration/role testing, worker lease/restart/concurrency tests, independent review, operator handling and retention design. | Migration 080 was applied to the configured Supabase project; verify the intended hosted worker runtime and record unattended recovery, outage and duplicate-delivery evidence. |
| 6 | Finish lower-level payment/job service logging migration, scoped catch inventory, failure-injection tests and independent review; decide whether remaining service logs are migrated or explicitly deferred. | Verify request ID and JSON log correlation on a non-production host; document platform retention/access and monitoring/alert ownership. Sentry/OpenTelemetry remains a separate decision. |
| 7 | Full 83-file fresh replay/schema-role checks pass in CI run 37746535695; verify actual Redis Lua concurrency/expiry; formal commit/protected-boundary review. Default CI production build and local webpack build pass. | Provision isolated Redis per deployment, verify hosted limits/outages and smoke flows; require the passing CI checks; deploy approved changes and assign outage monitoring ownership. |

Update each row when work is completed, moved, or explicitly deferred; link the evidence or decision in its issue guide. Do not leave “none” implicit.

## Issue 2: completed

- Manual verification, job-read reconciliation, release verification and compatibility/mock entry points share stored-payment validation.
- Live provider success must match the stored provider, exact reference, integer amount, currency and job parties. Client provider hints cannot override the obligation; fractional minor units are rejected.
- Manual verification requires the authenticated payment customer. Bank-transfer clients attach authentication.
- Flutterwave v3 webhook authentication uses a dedicated secret hash and constant-time comparison; the notification triggers independent provider verification.
- Missing rows, early checkout binding and transient provider/database failures request webhook retry. Duplicate confirmation is guarded by conditional persistence.
- Checkout checks its stored intent and binds only the unchanged agreed job. Booking writes only payment/status fields and does not overwrite unrelated job data.
- Regression coverage: 73 payment confirmation/provider/persistence cases. Full validation: 97 files / 1,159 tests passed; typecheck passed; lint had zero errors and 167 existing warnings; diff check passed.

Implementation/setup: [PAYMENT_CONFIRMATION_IMPLEMENTATION.md](PAYMENT_CONFIRMATION_IMPLEMENTATION.md). Original scope: [PAYMENT_CONFIRMATION_PLAN.md](PAYMENT_CONFIRMATION_PLAN.md).

## Issue 2: limitations and work left

### Release verification still required

1. Configure a dedicated test webhook secret and test-account HTTPS endpoint; enable Flutterwave retries. Neither hosted configuration nor deployment was changed by this implementation.
2. Complete a real test-account transfer with the browser closed. Verify durable held escrow and booked job; repeat webhook/manual verification and confirm one booking transition.
3. Exercise delayed/early delivery, invalid authentication, provider outages and check-again recovery against the dev deployment.
4. Perform authenticated browser smoke checks for bank transfer, callback, Call, Chat, Back and negotiation behavior. Mocked tests do not establish deployed behavior.
5. Review historical held rows before treating them as newly validated. Already-funded rows retain the existing trust assumption; this change does not audit them.

### Engineering limits to carry forward

- **No aggregate transaction:** holding payment and booking a job are separate writes. A failed booking can leave held money; retry can repair an agreed job. Cancellation/refund can still race between those writes. Resolve under Issue 5 with a transaction/RPC and explicit terminal-job recovery.
- **Incomplete write coverage:** other job/refund workflows retain unconditional or degraded persistence. Payment-specific conditional writes do not protect the entire aggregate. Resolve under Issue 4.
- **No durable inbox/outbox or reconciliation queue:** provider retries are finite. A crash can lose an optional booking event; permanent mismatches and cancelled/superseded payments need operator review. Add durable processing/recovery before removing repair-on-read under Issue 5, with observability under Issue 6.
- **Reads still mutate:** ordinary job reads can verify payments and repair state. Keep that recovery until an independently scheduled durable reconciler is proven; then make reads pure under Issue 5.
- **Distributed limiter rollout remains:** Issue 7 replaces the process-local browser verification limiter with atomic Redis locally. Real Redis integration and hosted rollout verification remain pending under its guide.
- Shop, Express and wallet remain separate financial lifecycles; this job-escrow work does not establish equivalent confirmation guarantees for them.

## Next: Issue 3 — unattended deadline enforcement

The repository’s `vercel.json` schedules `/api/jobs/pairing-sweep` and `/api/jobs/expire-stale` daily. That does not establish minute-scale unattended enforcement. External/deployed schedules have not been inspected.

Implement in a separate branch/change:

1. Inspect both routes, current deployed scheduler and deployment-plan limits; select an actual supported one-minute scheduler rather than only changing a cron expression.
2. Require a configured server scheduler secret for privileged sweep execution; audit existing client-triggered compatibility behavior before removing it.
3. Preserve shared pairing/negotiation deadlines and all assignment, fee and refund rules. The scheduler invokes existing domain operations; it does not redefine timers.
4. Ensure overlapping executions claim or conditionally update work safely; failed runs remain retryable and report their outcome.
5. Validate with no browser open: pairing progresses and overdue negotiation is handled by server runs. Test missing/incorrect secrets, duplicate/overlapping runs and restart recovery.
6. Document target URL, cadence, secret configuration, failure monitoring and dev evidence. Production scheduler configuration remains a distinct rollout action.

Issue 2’s release checks should be completed before its deployment is described as verified. Issue 3 can be developed independently while those checks remain open.

Issue 3 implementation and rollout details: [deadline scheduler](ISSUE_3_DEADLINE_SCHEDULER.md).

## Issue 4: conditional job persistence

Implementation guide and review criteria: [Issue 4 job persistence](review-guides/issue-4-job-persistence.md).

The merged Issue 4 change adds `service_requests.job_version` and a trigger that increments it on each row update. The shared job-store write compares the version and saves one complete patch; failed storage writes no longer fall back to smaller patches or process memory. Ordinary job reads and lists use durable database results only. Pairing, negotiation, payment confirmation, admin/care updates, and payout finalization use version or expected-state guards. Migration 079 was applied to the configured Supabase project on 2026-10-07; verification confirmed the non-null column, enabled trigger, ledger entry, and zero null versions. Formal review, isolated migration reapplication, and hosted runtime checks remain pending. Cross-table atomicity remains Issue 5.

## Pairing dispatch follow-up (2026-10-19)

The [atomic dispatch review guide](review-guides/pairing-atomic-dispatch.md) tracks a focused Issue 4/5 follow-up: classification can increment job_version after queue insertion but before the assignment CAS, leaving an offered pro unassigned. The implementation uses a transactional, service-role-only migration 081 RPC and bounded candidate reselection on conflicts. This does not close either issue or the scheduler rollout criteria.

Code: focused regression, disposable PostgreSQL concurrency/rollback/permission checks, and repository gates passed (1,476 tests, typecheck, lint with zero errors). Independent human review and full-history Supabase replay remain pending. Configured database: user authorized and applied 078/081 after verifying the 079 trigger. Localhost smoke passed with independent customer/pro HTTP sessions and realtime: assigned -> reserved -> negotiating, then cancellation cleanup. Pairing-sweep returned 200 and released its lease. The local debug polling pause was saved and lifted for testing. External residuals: direct browser visual/click smoke (automation unavailable), deployed-host verification and unattended overdue recovery remain pending. Existing orphan repair, customer-selected-pro creation, initial-create error reporting and other nontransactional pairing transitions remain outside this fix. See the linked guide for evidence and limits.

## Pairing acceptance handoff follow-up (2026-10-19)

The [acceptance handoff review guide](review-guides/pairing-acceptance-handoff.md) records the observed Open version conflict followed by optimistic navigation into labour negotiation. Migration 082 makes reservation plus review state one locked transaction. Automatic/tap Open share an in-flight result and release failed attempts for retry; the card remains until real Confirm success. Labour controls require confirmed negotiation, and Confirm replay preserves its timer. Pairing/negotiation windows and prices are unchanged.

Code evidence: 1,487 tests / 141 files passed, typecheck passed, lint 0 errors / 145 warnings; disposable PostgreSQL contention, rollback, replay and permissions passed. Configured database: 082 applied with server-only execute. Authenticated localhost smoke confirmed one reservation under concurrent Open, negotiation and replay, first NGN 5,000 offer visible to customer, realtime delivery and sweep 200; unpaid test cancelled. Earlier Turbopack-interrupted test cleaned up after restart. Changes remain uncommitted; independent review, rendered browser smoke, full-history Supabase replay and hosted rollout remain pending. Expired requests are not revived. Broader Confirm/decline/payment atomicity and unattended enforcement remain outside this fix.
