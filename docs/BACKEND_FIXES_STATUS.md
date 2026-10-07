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
| 7 | Migration CI, distributed rate limiting and server-only guards | Prepared on `codex/backend-observability-hygiene` for review into `dev`: isolated full-history migration CI, atomic Redis limiter and deployed failure handling, server-only boundaries and shared DTO/helper moves. Local gates are recorded in the [Issue 7 guide](review-guides/issue-7-backend-hygiene.md); fresh Supabase replay, real Redis integration, formal review and hosted rollout remain pending. |

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
| 7 | Run full fresh Supabase migration/schema-role checks and resolve any CI failures; verify actual Redis Lua concurrency/expiry; formal commit/protected-boundary review. Default Turbopack build remains unverified; webpack build passes. | Provision isolated Redis per deployment, verify hosted limits/outages and smoke flows; run CI and require its checks; deploy approved changes and assign outage monitoring ownership. |

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
