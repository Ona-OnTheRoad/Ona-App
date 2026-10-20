# Live updates Phase 3 — adaptive recovery polling

## Goal

Implement [Phase 3 of the live updates improvement plan](../LIVE_UPDATES_IMPROVEMENT_PLAN.md): expose subscription health states (`connecting`, `connected`, `reconnecting`, `failed`), slow down safety reconciliation polling when realtime is healthy, apply bounded exponential backoff with jitter during degraded/failed recovery, and reconcile promptly on subscription readiness, reconnect, browser `online`, and tab visibility. Scope approved by the user on 2026-10-20.

Branch: `backend/live-updates-phase3-adaptive-polling`. Baseline: `5ddaf5e45d708bee7127913d7a4917efff91f061` (`dev`).

## Expected change areas

- `src/lib/supabase/shared-job-subscriptions.ts` and `src/lib/supabase/app-api.ts`: track per-channel health state (`connecting`, `connected`, `reconnecting`, `failed`) and notify optional consumer status callbacks while keeping the public `backendSubscribeJobs` export backward-compatible.
- `src/lib/jobs/adaptive-poll.ts`: pure interval calculation for healthy versus degraded/unconnected states, bounded exponential backoff on consecutive failures, and bounded jitter.
- `src/components/jobs/job-flow-screen/use-job-poll.ts`, `src/components/jobs/job-flow-screen/use-job-load.ts`, and `src/components/jobs/job-flow-screen/use-job-guards.ts`: adaptive timer scheduling, subscription readiness/reconnect reconciliation, online/visibility reconciliation, and deduplication of redundant negotiation interval timers when `useJobPoll` already manages adaptive polling.
- `src/lib/store/use-cloud-realtime.ts`: reconcile cloud jobs on subscription reconnect (`SUBSCRIBED` after prior error/disconnect) and browser `online`.
- Focused regression tests in `src/lib/supabase/__tests__/shared-job-subscriptions.test.tsx`, `src/lib/jobs/__tests__/adaptive-poll.test.ts`, and `src/components/jobs/job-flow-screen/__tests__/job-poll-recovery.test.tsx`.
- Preserve all protected files (`docs/RULES.md` §10), Repair Pro incoming card rules (`docs/ANTI_REGRESSION.md` §10–11), and authoritative server deadlines (`pairingDeadline`, `negotiateEndsAt`).

## Implementation plan

1. Extend the tab-local shared job subscription registry to track subscription health (`connecting`, `connected`, `reconnecting`, `failed`) from Supabase channel status callbacks (`SUBSCRIBED`, `CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`). Immediately inform newly attached consumers if the shared channel is already `connected` (or in a degraded state), and ignore late status callbacks from retired channel generations.
2. Create `src/lib/jobs/adaptive-poll.ts` with pure helpers for nominal vs. healthy-realtime safety intervals per job status, bounded exponential backoff on consecutive read failures, and bounded jitter.
3. Update `useJobPoll` and `useJobLoad` so poll outcomes (`ok`, `http-error`, `skipped`) feed failure-backoff tracking, timers reschedule adaptively without overlapping in-flight reads, and transitions to `connected` (covering initial fetch-to-subscribe gap and reconnects), browser `online`, and tab `visibilitychange` trigger coordinated reconciliation reads.
4. Remove the duplicate 20s negotiation `setInterval` in `useJobGuards` while keeping `focus` and `visibilitychange` reconciliation intact, so negotiation polling is governed cleanly by `useJobPoll`'s adaptive cadence (8s degraded / 30s healthy).
5. Update `useCloudRealtime` to trigger a coordinated cloud job refresh when the shared job channel reconnects after a disconnect/error or when the browser returns `online`.
6. Verify all criteria with unit/integration tests and repository gates (`npm run lint`, `npm run typecheck`, `npm run test`). Record code/test evidence separately from browser/hosted evidence.

## Reviewer procedure

Inspect each criterion (`P1`–`P6`, `L1`–`L2`) in `live-updates-phase3-adaptive-polling.json` against the exact implementation commit. Verify with deterministic fake timers that:
- Unconnected/degraded polling preserves fast baseline intervals (`1s` pairing, `8s` negotiation/agreed, `15s` active/completed, `45s` released/satisfied, `60s` terminal).
- Healthy `SUBSCRIBED` state shifts to slower safety intervals (`10s` pairing, `30s` negotiation/agreed, `45s` active/completed, `120s` released/satisfied, `180s` terminal) while local countdowns (`useExactCountdown`) still tick every second from server deadlines.
- Channel degradation (`CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`) or `offline` shifts back to recovery polling, and consecutive read failures back off exponentially within bounds.
- Initial readiness (`SUBSCRIBED`), reconnect, `online`, and `visibilitychange` reconcile via the shared single-flight loader.

## Boundaries and limitations

- Does not alter product deadlines (`144s` pairing, `20m` negotiation, `11m` payment), fee math, call-out rules, or protected files (`docs/RULES.md` §10).
- Does not modify Repair Pro incoming-request popup fast close-check rules (`docs/ANTI_REGRESSION.md` §10–11).
- Does not remove browser-triggered maintenance sweeps (`Phase 4`) or change transport to Broadcast (`Phase 5`).
- Phase 1 representative browser captures/targets and Phase 2B composite revision ordering (`R4`) remain separate open items.

## Remaining work

- **Code:** Independent human review against the implementation commit; Phase 2B `R4` composite revision ordering for related profile/call-out data; Phase 4 browser-sweep reduction after hosted scheduler verification.
- **External:** Authenticated browser smoke for reconnect, offline/online transitions, and multi-consumer navigation; Phase 1 representative baseline captures and numerical target agreement; hosted deployment verification.

## Closeout

Update this guide, `live-updates-phase3-adaptive-polling.json`, `docs/LIVE_UPDATES_IMPROVEMENT_PLAN.md`, and `docs/BACKEND_FIXES_STATUS.md` with the exact evidence commit and test results while keeping unrun browser/hosted checks `pending`.

## Implemented behavior and verification evidence

- `shared-job-subscriptions.ts` and `app-api.ts`: tracks `connecting`, `connected`, `reconnecting`, and `failed` states per shared user channel. Late-joining consumers on an active channel immediately receive the current state (when not `connecting`). Subsequent `SUBSCRIBED` transitions after a prior connection mark `meta.reconnected = true`. Throwing status listeners are isolated and recorded as consumer errors without leaking raw error text.
- `adaptive-poll.ts`: defines nominal degraded intervals (`1s` pairing, `8s` negotiation/searching/agreed, `15s` active/completed, `45s` released/satisfied, `60s` terminal, `2s` missing) and slower healthy-realtime safety intervals (`10s` pairing, `30s` negotiation/searching/agreed, `45s` active/completed, `120s` released/satisfied, `180s` terminal, `2s` missing). Consecutive read failures apply bounded exponential backoff (`base * 2^failures` capped at `getMaxJobPollBackoffMs`) with symmetric bounded jitter (`±15%` default).
- `use-job-poll.ts`, `use-job-load.ts`, and `use-job-guards.ts`: `useJobLoad` records the last load outcome (`ok`, `http-error`, `skipped`) on `lastOutcomeRef` while preserving `load(): Promise<void>`. `useJobPoll` schedules adaptive `setTimeout` ticks (never overlapping in-flight reads), shifts between healthy and degraded cadences on channel status or browser `online`/`offline` transitions, reconciles immediately on reconnect, initial in-flight `SUBSCRIBED` gap, `online`, and `visibilitychange`, and resets failure backoff on recovery. `useJobGuards` retains `focus` reconciliation while delegating periodic negotiation polling to `useJobPoll`.
- `use-cloud-realtime.ts`: triggers a debounced realtime refresh when the shared job channel reconnects (`state === "connected" && meta.reconnected`) and an immediate visibility refresh when the browser fires `online`.
- Local gates: **175 test files / 1,717 tests passed; `npm run typecheck` passed; `npm run lint` passed with 0 errors; `git diff --check` passed.** Code/test evidence commit: `35e09cb7ab90b75af1e2034c52e6c3dbfc4e86c8`. Independent human review and browser/hosted checks (`L1`, `L2`) remain pending.
