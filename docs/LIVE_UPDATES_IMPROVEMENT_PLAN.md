# Live updates: phased improvement proposal

Date: 2026-10-19  
Status: phased proposal; Phase 1 tooling merged to dev in PR #25; representative browser/hosted baseline and target agreement pending. Phase 2A shared subscriptions merged to dev in PR #26 (`448d234`); browser/hosted verification remains pending. Phase 2B cloud-list/active-detail read coordination is approved and implemented in the working tree; aggregate revision coverage, independent review and browser/hosted verification remain open. Later phases remain proposed.

## Goal and recommendation

Keep job updates responsive as concurrent usage grows, while reducing repeated reads, mobile data usage and browser-triggered maintenance. Build on the existing Supabase Realtime integration, with coordinated snapshot fetching and slower recovery polling. Introduce a custom WebSocket service only if measurements demonstrate that the managed service cannot meet requirements.

This document records an implementation proposal, not approval to change protected files or proof of production performance. No application code or hosted configuration was changed to prepare it.

Before each implementation phase, remind the user to create or update its review guide in `docs/review-guides/`, starting from `TEMPLATE.md`. Present the phase plan and review criteria before feature code. Record code/test evidence separately from deployment evidence, identify the reviewed commit, and leave unrun checks pending. Follow `HANDOFF.md`, `RULES.md` and `ANTI_REGRESSION.md`; preserve assignment, fee, payment and timer rules.

## Current implementation and assessment limits

Local source inspection found:

- `src/lib/supabase/app-api.ts`: `backendSubscribeJobs` subscribes to `service_requests` changes filtered by customer/pro ID. Realtime already exists alongside polling.
- `src/components/jobs/job-flow-screen/use-job-poll.ts`: active job polling runs every 1 second during pairing, 8 seconds during negotiation/searching/agreement, 15 seconds for active/completed jobs, and 45–60 seconds for other loaded states. Missing-job recovery polls every 2 seconds. Recurring polling skips hidden tabs.
- `src/lib/store/use-cloud-realtime.ts`: global job refresh runs every 120 seconds, after relevant realtime events and on returning to a visible tab. The job screen separately subscribes and reloads. This can duplicate event-triggered work.
- `src/components/jobs/job-flow-screen/use-job-sweep.ts`: browser recovery calls broad maintenance on entry and every 180 seconds, or 45 seconds for pending payout-related states. The global hook separately requests maintenance after opening and periodically afterward.
- `src/app/api/jobs/expire-stale/route.ts`: maintenance includes overdue jobs, unaccepted jobs, zombie status cleanup, pairing, scheduled dispatch and payout retries. A route-level in-memory pairing throttle alone cannot coordinate all server instances or all maintenance families.
- `src/app/api/jobs/[id]/route.ts`: a snapshot read includes authentication, job access checks and call-out quote resolution. Request counts do not equal database query counts.

Important qualification: [Issue 3 already implements unattended deadline processing and durable sweep leases](ISSUE_3_DEADLINE_SCHEDULER.md). Reuse and assess that work. Do not infer that all maintenance lacks distributed protection, build a second scheduler, or claim its hosted activation is verified. Issue 3 covers pairing and armed negotiation; broader maintenance families require separate assessment. Checked-in Vercel cron entries remain daily.

The working tree contained unrelated in-progress changes during this assessment. Recheck the implementation against the chosen baseline commit before coding. No live scheduler, Supabase publication/RLS configuration, subscription health, production plan, payload distribution or traffic profile was verified.

## Scale and cost model

For one polling loop: requests/second = visible active tabs / interval in seconds.

| Interval | Requests/second at 1,000 tabs | Requests/hour |
| --- | ---: | ---: |
| 1 second | 1,000 | 3,600,000 |
| 8 seconds | 125 | 450,000 |
| 15 seconds | approximately 67 | 240,000 |
| 120 seconds | approximately 8 | 30,000 |

These scenarios assume every tab remains in that state throughout the hour. They exclude event refreshes, maintenance, retries and other endpoints. At 10,000 tabs, multiply by ten. Registered users and concurrent active tabs are different quantities.

Illustration only: a 5 KB response at 1,000 requests/second transfers approximately 18 GB/hour of response bodies. Measure actual response sizes before budgeting.

Estimate cost using measured function duration, query count/latency, database capacity, transfer, realtime delivered messages and peak connections. Account for multiple tabs, fan-out, retries and maintenance separately. Do not estimate savings from HTTP request counts alone.

## Approach comparison

| Approach | Benefits | Costs and limitations |
| --- | --- | --- |
| Polling | Simple, observable, recovers on the next successful read | Repeated unchanged reads; latency/load tradeoff; overlapping requests; mobile data/battery use |
| Managed realtime | Low latency; avoids constant unchanged reads; existing integration | Connection/message quotas; authorization; reconnect recovery; fan-out and database change processing costs |
| Realtime with recovery polling | Responsive updates plus periodic reconciliation | Requires shared coordination to avoid paying for both mechanisms unnecessarily |
| Custom WebSocket service | Greater control over protocol and delivery | Additional hosting, authentication, deployment, scaling, monitoring and operational ownership |

Prefer the hybrid approach. Realtime delivery must not be the authority for money or job transitions: authenticated server actions and durable database state remain authoritative.

## Phase 1 — establish the baseline

1. Select and record the baseline commit and inventory all job-related polling, subscriptions, retry loops and maintenance callers, including incoming-request UI.
2. Measure requests per user/state, response sizes, fetch duration, query latency, realtime lag, reconnects and duplicate refreshes.
3. Inspect hosted subscription health, authorization, quotas and actual scheduler delivery. Reconcile with Issue 3's outstanding deployment evidence.
4. Agree numerical targets for update latency, recovery time, deadline lag, error rate and infrastructure budget before optimization.

Review criteria: reproducible baseline and representative state mix; no secrets or personal job payloads in telemetry; each traffic source attributed; numeric targets recorded. Code evidence and hosted observations are both pending.

## Phase 2 — coordinate subscriptions and snapshot reads

1. Provide one shared coordination path for each job's data across the store and active screen. Reuse the Supabase client; avoid unnecessary duplicate channels and handlers.
2. Coalesce repeated change notifications and share in-flight reads. Ensure a change arriving during a fetch causes a follow-up reconciliation when needed.
3. Prevent responses for an old job/account or older snapshot from replacing current state. Define a reliable revision strategy; do not assume arbitrary client timestamps establish ordering.
4. Clean up on navigation, sign-out and role/account changes. Keep initial snapshot loading and authorized server reads.

Likely areas: `use-cloud-realtime.ts`, `use-cloud-data.ts`, `use-job-poll.ts`, `use-job-load.ts`, Supabase subscription helpers and their consumers.

Review criteria: one coordinated read per burst where possible; no overlapping duplicate reads for the same resource; updates during fetch are retained; stale responses cannot regress state; navigation and account switching leave no stale subscriptions or unauthorized data. Regression coverage pending.

## Phase 3 — make recovery polling adaptive

1. Expose subscription states such as connected, reconnecting and failed. Confirm subscription readiness before treating realtime as healthy.
2. With a healthy subscription, use events for prompt updates and a slower safety reconciliation interval selected from Phase 1 results.
3. During disconnection, temporarily use state-appropriate recovery polling with bounded exponential backoff and jitter. Avoid overlapping fetches.
4. Reconcile after subscription/reconnection and when returning online or to a visible tab; account for changes between initial fetch and subscription readiness.
5. Display countdowns from authoritative server deadlines. A local visual timer should not require a network request every second.

Dependencies: Phase 2 and verified realtime configuration. Preserve recovery until replacement behavior has passed review. Proposed intervals require measurement and agreement; this document does not authorize changing product deadlines.

Review criteria: pairing and negotiation update latency meets agreed targets; dropped events and reconnects recover within the target; offline recovery creates no retry storm; hidden-tab handling works; terminal jobs avoid unnecessary rapid polling. All checks pending.

## Phase 4 — reduce browser-triggered maintenance safely

1. Reuse the existing deadline scheduler and leases. Verify hosted cadence, authentication, durable claims, alerts and backlog catch-up with no browsers open.
2. Inventory every remaining maintenance family: booked expiry/refunds, unaccepted jobs, cleanup, second-pro dispatch and payout retries. Assign each a server cadence and operational owner based on its existing rules.
3. Review distributed coordination, conditional transitions and idempotency per family. A sweep lease alone does not make downstream payment or multi-record effects safe.
4. Remove routine broad browser sweeps incrementally only after unattended processing for the affected family is proven. Retain narrowly scoped, authorized recovery only where justified.
5. Monitor oldest overdue work, saturation, execution time, failures and recovery after worker interruption. Define retry and escalation procedures.

Likely areas: existing deadline routes/helpers, `expire-stale`, browser sweep hooks and scheduler configuration. Protected job-store and payout files require applicable tests and human review.

Review criteria: jobs progress with all browsers closed; deadline lag stays within agreed limits; concurrent browser/worker retries cause no duplicate transitions, refunds or payouts; interrupted workers recover; increasing tabs does not proportionally increase broad maintenance. Hosted configuration, fault injection and money-flow review remain pending.

## Phase 5 — evaluate private Broadcast if needed

1. Benchmark the improved Postgres Changes implementation before changing transport.
2. If latency, throughput, authorization work or cost warrants it, evaluate private user/job Broadcast topics with minimal change notifications, such as job ID and durable revision.
3. Enforce authorization for channel access. A topic name or row filter is not an authorization boundary. Verify both assignment participants, role switches and loss of access.
4. Define event-after-commit behavior and recovery for lost notifications. Keep snapshot reconciliation; add durable publication/outbox machinery only if delivery requirements justify it.
5. Limit marketplace/location fan-out to relevant audiences in a separately reviewed scope; do not broadcast all platform changes to all users.

Review criteria: measured advantage over the baseline; cross-user access tests pass; missed/duplicate/out-of-order events recover correctly; fan-out and provider quotas fit the budget. This phase is conditional, not a prerequisite to completing earlier improvements.

## Phase 6 — load test and roll out

1. Use isolated test infrastructure with synthetic users and no real financial effects. Model idle users, pairing, negotiation, trips, multiple tabs, reconnect bursts and overdue backlogs.
2. Test at 1,000 and 10,000 concurrent clients, plus a realistic mix of states. Report actual achieved load and generator limits.
3. Compare requests, database utilization, update latency percentiles, errors, transfer, delivered messages, peak connections and estimated monthly costs.
4. Roll out in stages with documented monitoring, operational ownership and a rollback path. Retain recovery until hosted behavior is proven.

Review criteria: agreed performance/budget targets pass under representative load; payment and assignment regressions are absent; failed realtime and scheduler recovery are demonstrated; rollback is exercised. All evidence pending.

## Evidence and remaining work

| Phase | Implementation/test evidence | Hosted/release evidence |
| --- | --- | --- |
| 1: baseline | Opt-in instrumentation, source inventory and synthetic tests implemented; [Phase 1 guide](review-guides/live-updates-phase1-baseline.md) tracks local checks | Representative capture and hosted subscription/query/scheduler observations pending |
| 2: coordinated reads | [Phase 2A shared subscriptions](review-guides/live-updates-phase2a-shared-subscriptions.md) merged to dev in PR #26; [Phase 2B coordinated reads](review-guides/live-updates-phase2b-coordinated-reads.md) implemented in the working tree; full aggregate revision ordering and review remain pending | Pending |
| 3: adaptive recovery | Pending | Pending |
| 4: server maintenance | Existing Issue 3 evidence must be reviewed; additional scope pending | Activation and broader coverage unverified |
| 5: Broadcast evaluation | Conditional; pending | Conditional; pending |
| 6: load and rollout | Pending | Pending |

Next step: use the [Phase 1 capture procedure](live-updates/phase1-baseline.md) for representative authenticated scenarios, inspect hosted evidence and agree numerical targets/budget. The review guide is prepared; Phase 1 is not complete solely because its instrumentation tests pass. Later phases still require their own reviewed scope.

## Sources for later revalidation

- [Supabase Realtime pricing](https://supabase.com/docs/guides/realtime/pricing): message and peak-connection charging; recheck current allowances and rates when budgeting.
- [Supabase database subscription guidance](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes): Broadcast and Postgres Changes tradeoffs.
- [Postgres Changes limitations](https://supabase.com/docs/guides/realtime/postgres-changes#limitations): authorization and processing constraints.
- [Existing unattended deadline implementation](ISSUE_3_DEADLINE_SCHEDULER.md) and [its review guide](review-guides/issue-3-deadline-scheduler.md): reuse existing work and retain its stated limitations.
