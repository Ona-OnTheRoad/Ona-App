# Live updates — adaptive idle poll for the Repair Pro incoming-request popup

## Goal

Stop the Repair Pro home screen polling `GET /api/jobs?role=repair_pro&lean=1` every 3s when realtime is healthy. While the shared job channel is `connected` and the browser is online, the **idle** list poll (no card on screen) slows to a 10s safety interval, matching `getHealthyJobPollMs` for pairing. When realtime is `connecting`, `reconnecting`, `failed` or the browser is offline, the poll stays at 3s. Approved by the user on 2026-10-21 (plan, 10s interval, `missed_push` metric and rollback flag).

Builds on [Phase 3 adaptive polling](live-updates-phase3-adaptive-polling.md) and the shared subscription states in `src/lib/supabase/shared-job-subscriptions.ts`.

## Expected change areas

- `src/lib/jobs/adaptive-poll.ts`: new pure helper `getIncomingIdlePollMs` (3s degraded, 10s healthy, 3s when the rollback flag is off).
- `src/components/home/incoming-job-popup/use-incoming-poll.ts`: track subscription state via the existing `onStatusChange` argument of `backendSubscribeJobs`; choose the idle delay at timer-fire time; re-arm the timer when state or `online` changes; poll immediately on reconnect and `online`; record a `missed-push` diagnostic.
- `src/lib/jobs/diagnostics/types.ts`: new `missed-push` outcome.
- Tests in `src/lib/jobs/__tests__/adaptive-poll.test.ts` and `src/components/home/__tests__/incoming-idle-poll.test.tsx`.
- Preserve `docs/ANTI_REGRESSION.md` §10–11: 500ms card-visible cadence, `isProRequestCardKeepable` as the only keep/close rule, fast close, protected files (`docs/RULES.md` §10).

## Reviewer procedure

Inspect each criterion (`I1`–`I7`, `L1`–`L3`) in [live-updates-incoming-idle-poll.json](live-updates-incoming-idle-poll.json) against the exact implementation commit. Code/test evidence and live evidence are recorded separately; unrun live checks stay `pending`.

## Boundaries and limitations

- Card-visible cadence (500ms status check, full lean list every third tick) is **unchanged**.
- Risk accepted and bounded: with realtime `connected`, a missed push for a **new** offer can wait up to 10s (about 7% of the 144s pairing window). Closes are unaffected because the per-card status check still runs at 500ms. The `missed-push` diagnostic measures how often this happens.
- Rollback: set `NEXT_PUBLIC_INCOMING_IDLE_POLL_ADAPTIVE=false` to restore the fixed 3s idle poll (needs a rebuild because it is a `NEXT_PUBLIC_` variable).
- Not included: a lightweight `pro-incoming-new` probe endpoint (possible follow-up that would remove the risk and the load).

## Remaining work

- **Code:** independent human review against the implementation commit.
- **External:** live checks `L1`–`L3` in an authenticated Repair Pro browser session; review `missed-push` counts before widening the interval.

## Closeout

Update this guide, the JSON guide, `docs/LIVE_UPDATES_IMPROVEMENT_PLAN.md` and `docs/BACKEND_FIXES_STATUS.md` with the evidence commit and results. Keep unrun live checks `pending`.
