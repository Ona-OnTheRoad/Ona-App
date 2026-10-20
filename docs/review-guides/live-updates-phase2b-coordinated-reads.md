# Live updates Phase 2B — coordinated snapshot reads

## Goal

Complete the snapshot-read slice of [Phase 2](../LIVE_UPDATES_IMPROVEMENT_PLAN.md): share equivalent in-flight reads, retain invalidations received during a fetch, and prevent stale responses from replacing current state. Scope approved by the user on 2026-10-20 and committed in [PR #27](https://github.com/Ona-OnTheRoad/Ona-App/pull/27) targeting dev. Baseline: dev `448d2340be7400847cf94711e4690b1f246d1d98` (Phase 2A merged in PR #26). Code/test evidence commit: `085b27c5475c82c025c607d6f7fb03be69fa7d6b`. Independent reviewed commit: pending; no independent human review is established. All related changes are kept on `codex/live-updates-coordinated-reads`.

## Expected change areas

Small client coordination helpers under `src/lib/jobs/`; cloud jobs refresh in `src/lib/store/use-cloud-data.ts`; job screen loader/poll/bootstrap hooks; relevant read adapters and focused regression tests. Inspect list DTO mapping and existing durable revision coverage before selecting a revision guard. List and full-detail responses are different projections and retain separate resource keys. Preserve the public app-api subscription export and Phase 2A ownership.

## Implementation plan

1. Inventory snapshot consumers, mutation commits and revision fields. Establish separate keys for authenticated session generation, user, role, resource projection and job ID where applicable. Never key by access token or retain tokens in diagnostics.
2. Introduce tab-local single-flight coordination for equivalent reads. A realtime/visibility invalidation during a read marks it dirty and schedules one follow-up; interval ticks share existing work without building a backlog. Subsequent changes during the follow-up can mark it dirty again. Failures release the gate and preserve later recovery.
3. Integrate cloud list and active detail reads. Preserve initial loads, authorized server reads, current polling intervals, hidden-tab behavior and error handling. Distinguish successful empty lists from failed reads before changing list replacement behavior; failed reads retain displayed data.
4. Guard asynchronous snapshot commits by current session/role/job generation, including old snapshot errors and redirects; guard the shared job commit boundary used by mutation results. Inspect how mutation results compete with refreshes. Use server jobVersion where its coverage is established; do not use client timestamps or a request counter as proof of database revision ordering. Equal/missing versions and related-table fields need explicit tested merge rules. If existing revisions cannot cover a field safely, document the gap and propose a separately reviewed extension before claiming complete stale-snapshot protection.
5. Keep retained state bounded to active consumers/in-flight work; invalidate on sign-out, account/role changes and navigation. Maintain diagnostics for shared reads and follow-ups without job payload logging.
6. Run race-focused tests, lint, typecheck, full tests, server-boundary and production build checks. Record independent review and browser/hosted checks separately.

## Reviewer procedure

Review paired JSON criteria against an exact implementation commit. Use controlled deferred responses to exercise duplicates, mid-flight invalidation, failures, mutation/read ordering and account A → B → A. Verify integration at actual caller boundaries, rather than only testing the helper. Record evidence for each affected projection and revision limitation.

## Boundaries and limitations

No adaptive polling, transport/provider changes, scheduler changes, database migration, fee/assignment/payment behavior changes or protected-file regeneration is approved here. Any necessary scope expansion returns to plan/review first. Phase 1 representative captures/targets and Phase 2A browser lifecycle/hosted checks remain pending. Request-count tests do not establish latency, cost or scale improvements. Local checks cannot establish hosted RLS or deployment behavior.

## Remaining work

Code: independent review against an exact commit; decide a separately reviewed composite revision/merge strategy for related data before claiming complete aggregate ordering. No migration is required by this implementation. Existing direct detail readers in checkout, chat, notification, incoming and request-detail flows remain outside this cloud-store/active-screen coordination slice.

External: Phase 2A authenticated navigation/account-switch/reconnect smoke; Phase 1 representative captures and target agreement; Phase 2B slow-network/multi-consumer/browser lifecycle verification; hosted authorization/reconnect checks and deployment verification. All pending. The CUA browser inventory returned no connected browser surfaces in this session; native Chrome being open does not establish a connected browser automation session.

## Closeout

Update this guide, its paired JSON and `docs/BACKEND_FIXES_STATUS.md` with exact evidence and unresolved criteria. Implementation and live release evidence remain separate.

## Implemented behavior and revision audit

- `snapshot-reads.ts` shares equivalent active reads with one queued follow-up per resource, retaining further invalidations received during that follow-up. Each active consumer has one reader candidate; departing consumers cannot start queued work, while surviving consumers can continue. Settled data is not cached. `use-snapshot-scope.ts` owns observed authenticated user/role lifetimes and per-screen navigation generations; Strict Mode effect replay retires old captures.
- `use-cloud-jobs.ts` coordinates the lightweight `/api/requests` projection independently from full job detail. The strict adapter distinguishes failures from successful empty lists and adds a 15-second abort bound so a hung list cannot hold its lane indefinitely. Existing authFetch authentication/retry behavior is reused. Empty success removes unchanged old rows, while local edits/additions made during a fetch survive until a subsequent reconciliation. Equality includes all bounded DTO fields, so same-status name/location changes render.
- `/api/requests` now selects and maps the already-existing `job_version` to optional `ServiceRequest.jobVersion`. Migration 079's job-row trigger is existing infrastructure; no migration or hosted database change was made. The existing full job mapper already supplies `JobRecord.jobVersion`.
- The active loader shares detail reads, ignores retired responses/errors/redirects, and clears old account/role/job state while preserving a destination seed for the same authenticated role. Poll intervals and visibility behavior are unchanged. Lower durable revisions cannot replace newer rows, including through the forced mutation commit boundary. An equal-revision background response cannot undo an optimistic status. Explicit action reconciliation can roll back a failed optimistic change. Equal/missing-version responses cannot overwrite intervening commits.
- **Ordering limit:** `job_version` covers `service_requests`, not separately read profiles, resolved call-out quotes or all related records. Equal-revision same-status responses can refresh related fields when no intervening local commit was observed; this is reconciliation, not a proof of aggregate consistency. Existing unversioned display fallback is not a durable ordering guarantee. A composite revision/merge design remains proposed follow-up; criterion R4 stays pending for complete aggregate ordering. No protected fee, job-store, payout or payment logic was changed.

## Verification evidence

Final working-tree gates after the last source change: **172 test files / 1,662 tests passed; typecheck passed; lint passed with 0 errors / 139 existing warnings; webpack production build passed; server-boundary negative build and diff whitespace check passed.** Typecheck was rerun successfully after the build completed, because running it concurrently with Next generation had temporarily removed its generated input files. Independent review and all browser/hosted criteria remain pending. Session-local logs are `/private/tmp/ona-phase2b-{tests,lint,types,boundaries,webpack,build-escalated}.log`. Turbopack's default production build hit the worker-port permission restriction both in the sandbox and after escalation; the local attempt is not marked passed. GitHub [CI run 39412908936](https://github.com/Ona-OnTheRoad/Ona-App/actions/runs/39412908936) passed all four jobs on code evidence commit `085b27c5475c82c025c607d6f7fb03be69fa7d6b`: lint/typecheck, tests, full-history migration replay with schema/role assertions, and default Turbopack production build with server-boundary checks. Vercel and Netlify preview build checks also passed; this is build evidence, not authenticated runtime or deployment acceptance.

## Proposed revision follow-up (not approved implementation)

Inventory related fields on each response and identify which existing durable source revision can order each field group. Propose either a verified revision vector per projection or independent field-group reconciliation, with explicit handling for missing/equal revisions and optimistic updates. Review any required writer/migration/protected-file changes separately. Validate concurrent job-row, profile and quote updates with reordered responses before marking R4 complete. Do not infer aggregate ordering from local request sequences or arbitrary timestamps.

## Related follow-up — temporary IDs in call-out reads (2026-10-20)

User approved the diagnosed fix after reporting GET `/api/jobs/pending-*/callout` returning 500. Continue on the same related feature branch, `codex/live-updates-coordinated-reads`, incorporating dev's merged PR #27 history first. Baseline: dev `7f9f68452bb2a2114a6ee12593c399d790385f3f`.

Plan: share a pure persisted-job UUID shape check between the call-out hook and route; skip temporary/malformed IDs and all their polling timers in the hook; keep fetched quotes tied to their job ID; prevent rejected retired reads from rearming retries; reject invalid authenticated route IDs with 400 before getJob. Preserve authentication, ownership checks, valid-ID polling/final-quote behavior and all fee calculations. Add hook and route regressions, then run repository gates. No protected pricing, payable, engine or job-store changes.

Criteria C1: pending/new/empty/malformed IDs cause no call-out HTTP reads or retry timers; switching to a real UUID starts normal loading. C2: authenticated malformed IDs return 400 without job-store/quote calls; unauthenticated requests still return 401, valid missing jobs 404, nonparties 403, and genuine storage failures retain error handling. C3: quotes cannot leak between job IDs, late completions cannot replace current quotes, cleanup prevents retries after rejected reads, and valid unresolved quotes retain the existing three-second retry/final-stop behavior. C4: full tests, typecheck and zero-error lint pass, with build/CI evidence recorded separately from browser/hosted evidence.

Follow-up code/test evidence commit: `ea8d450ccfca6513b9bbc901224902fd2436b9a3`. C1–C3 pass in the new hook/route regressions; C4 local gates pass: 174 files / 1,685 tests, typecheck, lint with 0 errors / 139 existing warnings, and whitespace checks. The existing incoming-card test fixture now uses a valid UUID; its original amount/night/fallback assertions are unchanged and pass. CI production build and migration replay are tracked by the follow-up PR's checks and must pass before merge; no local production-build pass is claimed for this follow-up. Logs: `/private/tmp/ona-callout-id-{targeted,tests,lint,types}.log`.

Code remaining: independent review against the follow-up commit. External remaining: authenticated pending-to-real browser smoke, hosted verification and deployment acceptance. A fresh CUA browser inventory returned no connected browsers. No migration, fee calculation, protected engine/payable/job-store or provider changes were made. Existing R4 aggregate ordering and other external follow-ups remain open.


PR/browser follow-up (2026-10-20): [PR #29](https://github.com/Ona-OnTheRoad/Ona-App/pull/29) opened against dev with code evidence `ea8d450` and review evidence `99c9881`. All four jobs pass on `99c9881` in [CI run 39469590205](https://github.com/Ona-OnTheRoad/Ona-App/actions/runs/39469590205): tests, lint/typecheck, full-history migration replay and default production build with server boundaries. Vercel and Netlify previews pass. In-app browser is connected. User-authorized customer login/home/history, customer signout then repair-pro login/dashboard/jobs and closed-job detail render passed on localhost; detail Back returned to pro Jobs. Customer home reported a location timeout; listed pro jobs were closed, and existing pending payout was left untouched. Pending-to-real new requests, active negotiation/realtime, slow-network/reconnect/multi-consumer captures and hosted acceptance remain pending. Development route compilation delays are not performance measurements; no representative baseline or C1–C3 browser completion is claimed. No account identifiers or OTPs retained in evidence.
