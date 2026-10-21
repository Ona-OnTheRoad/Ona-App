# Job polling recovery review guide

## Goal

Stop repeated immediate job reads after every snapshot update, prevent overlapping reads, and recover from background timeouts without unhandled promise rejections. User approved this scope on 2026-10-19.

## Expected change areas

Job polling/load hooks and background incoming/release/dashboard list reads. Preserve all polling intervals, hidden-tab behavior, realtime reconciliation, fees, assignment rules and payment timers. No Maps migration or server/auth redesign.

## Reviewer procedure

Review the final uncommitted diff against baseline `5bf2dfb087734b0da75fcb608211a331f56e73c1`; unrelated checkout/pairing work is present. Paired JSON maps requirements to evidence. Code checks and localhost/hosted checks are separate.

Scope update: verification found the same uncaught `apiListJobs` timeout in `use-dashboard-jobs.ts`. Include dashboard data retention, loading-state cleanup and serialized refresh/realtime recovery in this change. Dashboard soft refresh remains four minutes.

## Boundaries and limitations

This limits request amplification and catches failures. It does not establish why individual Supabase calls are slow, cancel already-running server work, or fix the disabled legacy Directions API. Keep the 15-second browser read timeout.

## Remaining work

Code: implementation and required checks complete; independent human review pending. Hook tests cover stable snapshot rerenders, interval timing, single in-flight reads, realtime follow-up, hidden-tab pause, cleanup, and timeout/data retention/recovery in job, incoming, release and dashboard polls.

Verification: `npm test` passed 1,520 tests / 145 files; `npm run typecheck` passed; `npm run lint` completed with 0 errors / 145 warnings; `git diff --check` passed. Session-local logs: `/private/tmp/ona-poll-{tests,typecheck,lint}.log`.

External: localhost slow-network recovery and hosted verification pending (browser inventory has no connected browser, so authenticated UI smoke was not run); Supabase/network latency and Google Maps configuration/migration require separate investigation.

Runtime verification also found a Flutterwave IP-whitelisting denial for payout. This is provider configuration, not proof of a polling failure; no payout was retried.

## Closeout

Uncommitted work on the recorded baseline. No migration/configuration changes required. Localhost/hosted evidence remains pending; unit checks do not establish external latency recovery. Residuals are recorded in `docs/BACKEND_FIXES_STATUS.md`.
