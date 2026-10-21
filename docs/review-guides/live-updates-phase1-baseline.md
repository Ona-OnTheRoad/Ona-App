# Live updates Phase 1 — baseline review guide

## Goal

Establish a reproducible baseline before changing subscription ownership or polling intervals. Implements the measurement scope of [the live-updates proposal](../LIVE_UPDATES_IMPROVEMENT_PLAN.md#phase-1--establish-the-baseline).

Branch: `codex/live-updates-baseline-diagnostics`. Baseline: `70cbae84471201e9c5cac60a9fc307732de899c1`. Status: user approved implementation on 2026-10-20; instrumentation implemented and local gates recorded below. Representative browser/hosted observations are pending; Phase 1 is not complete.

## Implementation plan and expected change areas

1. Inventory job detail/list/status reads, subscriptions, retries and maintenance callers against this baseline, including the recent polling fixes. Distinguish visual countdown timers from network timers.
2. Add opt-in, bounded, in-memory diagnostic counters with fixed source/trigger labels. Track counts, elapsed fetch time, success/timeout/error, concurrent reads, coalesced/skipped requests and subscription lifecycle. Attribute initial, interval, realtime, visibility and maintenance triggers separately. Default off; no telemetry upload endpoint or additional polling.
3. Instrument the job screen, global cloud-job refresh, dashboard, incoming panel and release poll, plus narrow subscription lifecycle hooks. Likely areas: `src/lib/jobs/` diagnostic helper, job client/read callers, `src/lib/store/use-cloud-{data,realtime}.ts`, `src/lib/supabase/app-api.ts`, and the corresponding component hooks.
4. Add route-level timing for authenticated job reads so auth, aggregate job loading (including hydration), and additional call-out resolution are distinguishable. Do not label aggregate job-load timing as one database query. Protected job-store internals are excluded. Actual database query latency remains a separate hosted measurement.
5. Provide a local diagnostic summary and a repeatable scenario procedure: idle, pairing, negotiating, active trip, hidden/visible tab, disconnect/reconnect and two tabs. Use supplied response-size headers when available; otherwise report bytes as unavailable, without consuming/logging response bodies. Measure event receipt to reconciled snapshot separately from true server-commit-to-screen lag; the latter requires controlled synthetic/hosted evidence.
6. Test privacy, bounded retention, source attribution, cleanup and default-off behavior. Run repository gates. Record actual local observations separately from hosted health, quota, scheduler and cost checks.

## Reviewer procedure and proposed acceptance criteria

Use the paired JSON guide. Each network/subscription source must have an inventory entry and an explicit measurement/coverage status. Disabled diagnostics must not add requests, subscriptions, timers or uploads. Enabled capture must remain bounded and clearable, record no token/header/body, user/job identifiers, coordinates or free-form error text, and preserve existing read/auth/state-transition behavior.

Instrumentation must not change polling intervals, fees, deadlines, payout/refund handling or server authority. Baseline output must distinguish measured data, unknown values and unrun scenarios. No production-scale or cost claim may be inferred from a local test.

Proposed comparison targets for later optimization review, not measurements or changes authorized by this phase: p95 realtime-receipt-to-reconciled-snapshot at most 2 seconds; p95 reconnect-to-reconciled-snapshot at most 5 seconds under a controlled healthy network; no overlapping duplicate read for one job within a coordinated tab. Validate these targets after Phase 1 observations. Disconnected recovery/deadline targets and an infrastructure budget remain to be agreed after measuring the existing paths and reviewing hosted capacity.

## Boundaries and limitations

No interval tuning, subscription consolidation, shared cache, custom WebSocket service, Broadcast migration, scheduler replacement, removal of browser maintenance, Google Maps migration or provider configuration changes. Preserve unrelated local pnpm files.

Hosted Supabase subscription readiness/auth/quotas, query latency, actual scheduler delivery and financial/environment configuration cannot be marked verified from source inspection or mocked tests. Do not perform real payments or alter live jobs to create baseline traffic.

## Remaining work

Runtime follow-up: the local forwarding export did not resolve the reported browser failure. Removed the extracted subscription module and restored the implementation directly in `app-api.ts`, retaining diagnostics and public-entry-point tests. Also moved the error-screen redirect out of its state updater; acceptance criteria are a single redirect after five seconds, no render-phase navigation warning, and timer cleanup on unmount. Browser/Turbopack verification remains pending.

Code: instrumentation, source inventory, capture runbook and deterministic measurement tests implemented. `npm test`: 1,606 tests / 165 files passed; typecheck passed; lint 0 errors / 139 warnings; server-boundary negative build passed; whitespace check passed. Webpack production build (`npm run build -- --webpack`) passed. Default Turbopack build remains unverified here: font-download failure in the sandbox, then worker-port binding denied on the network-enabled retry. Independent human review and default-bundler CI verification remain pending; application build configuration was not changed. Changes are prepared as a separate diagnostics PR; independent review remains pending. Evidence logs are session-local `/private/tmp/ona-baseline-*.log`; [capture procedure and interpretation](../live-updates/phase1-baseline.md).

External: representative authenticated browser capture, hosted subscription/query/scheduler observations, agreed operational budgets and release checks pending. No phase-complete claim until the outstanding evidence and targets are reconciled.

## Closeout

Existing polling intervals, channel ownership/filters, auth, fee/payment timers and protected server internals remain unchanged. Diagnostics are local/default-off; server stage header needs an explicit opt-in. Code/fixture evidence is separate from unrun browser/hosted checks. No reviewed implementation commit exists yet; independent review remains pending. Status ledger and paired JSON track residuals.
