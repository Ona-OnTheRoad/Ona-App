# Live updates Phase 4 — reduce browser-triggered maintenance safely

## Goal

Implement [Phase 4 of the live updates improvement plan](../LIVE_UPDATES_IMPROVEMENT_PLAN.md): coordinate and throttle browser-triggered and server-side maintenance sweeps (`expire-stale`, `pairing-sweep`), remove blocking broad maintenance calls from read-only list/history screens, scope active-job maintenance (`useJobSweep`) to jobs that actually need deadline or payout recovery, and ensure concurrent browser/worker sweeps coalesce safely without duplicate transitions, refunds, or payouts. Scope approved by the user on 2026-10-21.

Branch: `backend/live-updates-phase4-maintenance-reduction`. Baseline: `54b083ebf481184efcb17fe7aca6a626c931ab48` (`dev`).

## Expected change areas

- `src/lib/jobs/maintenance-coordinator.ts` and `src/lib/jobs/client.ts`: shared single-flight deduplication and cross-tab (`localStorage`) cooldown coordination for `apiExpireStaleBookedJobs` and `apiPairingSweep`, with diagnostic attribution (`coalesced`, `skipped`) when redundant requests are suppressed.
- `src/app/(customer)/requests/page.tsx` and `src/components/jobs-list/use-pro-past-jobs.ts`: remove blocking `await apiExpireStaleBookedJobs(...)` calls before `apiListJobs` so list and history loads do not block on or multiply broad server maintenance.
- `src/components/jobs/job-flow-screen/use-job-sweep.ts`: skip broad maintenance on terminal jobs (`cancelled`, `expired`, `released`, `refunded` without pending settlement), avoid re-firing immediate sweeps on non-overdue status transitions, and trigger immediate recovery only when a job has `pendingPayout` or an overdue deadline (`isAgreedPastPayToBookDeadline`, `isAgreedPastPaymentDeadline`, `isBookedPastCompletionDeadline`, `isCompletedPastAutoReleaseDeadline`).
- `src/components/jobs/motorist-release-pay-gate/use-release-pay-gate.ts`, `src/components/payments/checkout/use-checkout.ts`, and `src/lib/store/use-cloud-realtime.ts`: route background maintenance calls through the shared coordinator, mark checkout payment-expiry sweeps `urgent: true`, and avoid blocking `apiListJobs` on `expire-stale`.
- `src/lib/server/jobs/deadlines/maintenance-runner.ts`, `src/app/api/jobs/expire-stale/route.ts`, and `src/app/api/jobs/pairing-sweep/route.ts`: coalesce in-flight server executions and enforce per-family minimum intervals on `/api/jobs/expire-stale` (`30s` for `jobDeadlines`, `unaccepted`, `pairing`, `scheduledDispatch`; `60s` for `payoutRetry` and `zombies`), and handle `SweepBusyError` in browser recovery routes as an active in-progress sweep rather than a 500/503 error while preserving `/api/jobs/deadline-sweep`'s `503` scheduler retry behavior.
- Focused regression tests in `src/lib/jobs/__tests__/maintenance-coordinator.test.ts`, `src/components/jobs/job-flow-screen/__tests__/use-job-sweep.test.tsx`, `src/lib/server/jobs/deadlines/__tests__/maintenance-runner.test.ts`, and `src/lib/server/jobs/deadlines/__tests__/scheduler-routes.test.ts`.
- Preserve all protected files (`docs/RULES.md` §10), product deadlines, and payout/escrow rules.

## Reviewer procedure

Inspect each criterion (`M1`–`M6`, `L1`–`L2`) in [live-updates-phase4-maintenance-reduction.json](live-updates-phase4-maintenance-reduction.json) against the exact implementation commit. Verify that:
- Client maintenance calls share in-flight promises and respect routine (`120s` for `expire-stale`, `5s` for `pairing-sweep`) and urgent (`45s` for `expire-stale`) cooldowns across hooks and tabs via `localStorage`.
- Read-only list/history screens (`/requests`, `useProPastJobs`) and `useReleasePayGate` do not block `apiListJobs` on `apiExpireStaleBookedJobs`.
- `useJobSweep` skips terminal jobs without pending settlement and only fires immediate mount/transition sweeps when a deadline is overdue or `pendingPayout` is active.
- Server `/api/jobs/expire-stale` coalesces concurrent in-flight runs and throttles repeated family scans within their minimum intervals, and `SweepBusyError` in `/api/jobs/pairing-sweep` / `/api/jobs/expire-stale` returns a non-error busy outcome while `/api/jobs/deadline-sweep` retains `503`.
- No protected files (`docs/RULES.md` §10) are modified.

## Boundaries and limitations

- Does not modify protected job-store or payout files (`docs/RULES.md` §10) or alter any product timer (`144s` pairing, `20m` negotiation, `11m` payment, `30m` pay-to-book, `6h` completion/auto-release, `10m` payout retry spacing).
- Server-side `maintenance-runner.ts` coalesces in-flight work and enforces per-family minimum intervals per Node instance while `sweepPairing` and `sweepNegotiationDeadlines` additionally enforce cross-instance database leases (`job_sweep_leases`) and all job/payout mutations enforce `job_version` CAS or claim guards.
- Does not claim hosted scheduler activation (`Issue 3` external rollout remains tracked separately) or evaluate private Broadcast (`Phase 5`).

## Remaining work

- **Code:** Independent human review against the implementation commit.
- **External:** Multi-tab authenticated browser maintenance verification (`L1`), hosted `/api/jobs/deadline-sweep` activation and unattended catch-up verification (`L2`), and Phase 1 representative baseline captures/targets.

## Closeout

Update this guide, `live-updates-phase4-maintenance-reduction.json`, `docs/LIVE_UPDATES_IMPROVEMENT_PLAN.md`, and `docs/BACKEND_FIXES_STATUS.md` with the exact evidence commit and test results while keeping unrun browser/hosted checks `pending`.

## Implemented behavior and verification evidence

- `src/lib/jobs/maintenance-coordinator.ts` and `src/lib/jobs/client.ts`: `coordinateExpireStale` and `coordinatePairingSweep` coalesce concurrent in-flight calls per tab and enforce routine (`120s` for `expire-stale`, `5s` for `pairing-sweep`) and urgent (`45s` for `expire-stale`) cooldowns across hooks and browser tabs via `localStorage` (`ona:maintenance:expire-stale`, `ona:maintenance:pairing-sweep`). Failed calls do not advance `lastRunAt`, keeping immediate retries eligible. Coalesced and cooldown-skipped calls record `refresh` diagnostics (`coalesced`, `skipped`).
- `src/app/(customer)/requests/page.tsx`, `src/components/jobs-list/use-pro-past-jobs.ts`, `src/components/jobs/motorist-release-pay-gate/use-release-pay-gate.ts`, and `src/components/payments/checkout/use-checkout.ts`: removed blocking `await apiExpireStaleBookedJobs(...)` calls before `apiListJobs` on `/requests` and pro past-jobs history loads, made `useReleasePayGate`'s 2-minute sweep non-blocking, and marked checkout payment-session expiry sweeps `urgent: true`.
- `src/components/jobs/job-flow-screen/use-job-sweep.ts`: skips sweeps entirely for terminal jobs (`cancelled`, `expired`, `released`, `refunded`) without pending settlement, avoids re-firing immediate sweeps on non-overdue status transitions, triggers immediate sweeps only when `pendingPayout` or an overdue deadline (`jobNeedsImmediateMaintenanceSweep`) is present, and skips redundant `load("maintenance")` calls when `apiExpireStaleBookedJobs` was cooldown-skipped.
- `src/lib/server/jobs/deadlines/maintenance-runner.ts`, `src/app/api/jobs/expire-stale/route.ts`, and `src/app/api/jobs/pairing-sweep/route.ts`: coalesces concurrent in-flight executions and enforces per-family minimum intervals on browser-triggered `/api/jobs/expire-stale` (`30s` for `jobDeadlines`, `unaccepted`, `pairing`, `scheduledDispatch`; `60s` for `zombies`, `payoutRetry`) while allowing scheduler-authenticated requests (`hasSchedulerSecret`) to bypass browser throttling. `SweepBusyError` in `/api/jobs/pairing-sweep` and `/api/jobs/expire-stale` resolves cleanly without false error logs or 503 responses while `/api/jobs/deadline-sweep` retains `503` scheduler retry semantics.
- Local gates: **178 test files / 1,733 tests passed; `npm run typecheck` passed; `npm run lint` passed with 0 errors; `git diff --check` passed.** Independent human review and live browser/hosted checks (`L1`, `L2`) remain pending.
