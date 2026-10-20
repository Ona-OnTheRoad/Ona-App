# Live updates Phase 2A — shared job subscriptions

## Goal

Implement the subscription-ownership slice of Phase 2 in `docs/LIVE_UPDATES_IMPROVEMENT_PLAN.md`. Multiple consumers in one tab share one underlying job channel for the same user. Scope approved by the user on 2026-10-20; implementation and local test evidence recorded below.

Branch: `codex/live-updates-shared-subscriptions`. Baseline: `9cfe4db25afad8910ebe0b44f3b4e90fbc0e57ea`.

## Expected change areas

Keep the public local `backendSubscribeJobs` function in `src/lib/supabase/app-api.ts`; delegate internal lifecycle coordination to a small client-only registry. Existing cloud store, job screen, dashboard and incoming callers retain their API and callbacks. Add focused registry/public-entry-point regression tests. Update diagnostic attribution to distinguish physical channel lifecycle from consumer event delivery.

## Implementation plan

1. Register listeners by Supabase client identity and user ID within one tab; open one channel using the existing motorist/pro row filters.
2. Deliver each event to currently registered listeners; isolate a throwing listener so other consumers still receive it. Do not retain job snapshots or row payloads after dispatch.
3. Return an idempotent unsubscribe for each listener. Remove the physical channel only when its last consumer leaves. Ignore late events from removed channel generations; preserve account isolation and existing null return when the backend is unavailable.
4. Preserve the local public function export to avoid repeating the development export regression. Keep lifecycle diagnostics accurate for shared channels and callback delivery.
5. Test simultaneous consumers, one/last removal, repeated cleanup, resubscribe, user/client isolation, late events, callback errors, missing backend and public export compatibility; run lint, typecheck, full tests and build checks.

## Reviewer procedure

Review paired JSON criteria against the implementation commit. Demonstrate one channel for multiple same-user consumers, unchanged filters/payload delivery, continued delivery after one consumer unmounts, final cleanup and no delivery after cleanup. Verify account-switch/unmount behavior at caller boundaries. Record mock/code evidence separately from browser and hosted evidence.

## Boundaries and limitations

No snapshot-read coalescing, revision strategy, interval changes, cross-tab sharing, new transport, scheduler changes, provider configuration, pricing, assignment or payment changes. This is a Phase 2 slice, not completion of Phase 2. Phase 1 representative browser captures and hosted measurements remain pending; do not claim performance, cost or production authorization verification from channel-count tests. Row filters do not replace RLS. Preserve unrelated pnpm files.

## Remaining work

Code: implementation and regression tests complete. Full suite: 1,621 tests / 167 files passed; typecheck passed; lint 0 errors / 139 existing warnings; server-boundary check and whitespace check passed. Production webpack build passed. Local default Turbopack build hit the known worker-port permission restriction; CI verification and independent human review pending.
External: authenticated browser smoke for all four consumers, navigation/sign-out/account switching and reconnect; hosted subscription/RLS evidence; Phase 1 representative baseline and operational target agreement pending.

## Closeout

Update status ledger and paired guide with the exact implementation commit, actual evidence and unmet criteria. Implementation/local checks are recorded below; browser and hosted checks remain pending.

## Implementation evidence and interpretation

- Registry keyed by Supabase client identity and user ID shares a channel across all four consumers. Public `app-api.ts` keeps a local function export. Existing motorist/pro filters and raw callback payload shape are preserved.
- Each registration owns an idempotent disposer. Final removal invalidates the entry before SDK teardown; old event/status callbacks are ignored. A replacement may open while the SDK asynchronously retires the inactive old channel. No claim of instantaneous provider disconnect or cross-tab sharing.
- Physical lifecycle/events use `subscription/shared-jobs`; listener attachment/delivery/removal use `subscription-consumer/<source>`. Source-level event-to-read timing remains available. Physical and consumer counts must not be added as channel counts.
- Cloud-store job subscriptions now require authentication and rebind on role/account changes, cancelling prior debounce work. Timings and authenticated maintenance cadence are unchanged.
- Tests exercise same-user four-consumer sharing, exact filters, payload delivery, refcounts, duplicate callbacks, user/client isolation, removed generations, setup and removal failures, reentrant callback membership changes, callback error isolation, Strict Mode and cloud sign-out/role/account cleanup. No server or personal row payload is logged by diagnostics.
- Session-local evidence: `/private/tmp/ona-phase2a-{tests,types,lint,boundaries,build,webpack}.log`. This is mocked/code evidence, not hosted RLS, reconnect or performance proof.

Code/test evidence snapshot: `1e100835734e5f19b9fb5a5235941f7323b8446e`. This records the tested implementation, not independent human approval. No feature code changed after these gates.
