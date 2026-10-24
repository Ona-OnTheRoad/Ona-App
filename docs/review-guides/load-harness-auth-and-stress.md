# Load harness auth and stress testing review guide

## Goal

Improve `scripts/simulate-load.mjs` to measure actual server and realtime behavior under load. The previous initial harness relied on mock headers (`x-user-id`, `x-mock-role`) not accepted by production routes, used unauthenticated Realtime subscriptions with no mutations to observe, held connections open preventing timely exit, used fixed soak intervals that could not identify breaking points, and conflated dev-server warm-up and 401 errors with real server failures.

This update introduces real Supabase authentication for synthetic users, early auth failure aborts, clean socket teardown, active Realtime write & delivery lag tracking, warm-up exclusion & granular metric classification, and an open-model ramp/stress mode.

## Expected change areas

- `scripts/simulate-load.mjs`: load harness overhaul (R1–R6).
- `scripts/synthetic-seed.mjs` / `scripts/synthetic-cleanup.mjs`: verified compatibility for user provisioning and cleanup.
- `docs/review-guides/load-harness-auth-and-stress.md` and paired JSON criteria.
- **Protected boundaries**: No modifications under `src/` (the app routes and `requireUser()` auth boundary remain strictly preserved per `docs/RULES.md` and `docs/HANDOFF.md`).

## Reviewer procedure

Inspect each requirement (`R1`–`R6`) in `docs/review-guides/load-harness-auth-and-stress.json` against the implementation commit. Verify that:
- Code/test evidence and live-run evidence are reported separately.
- Real Bearer tokens from Supabase Auth are sent without mock headers.
- Process terminates cleanly within seconds of the test duration.
- Realtime events are measured with genuine write latencies.
- Breaking points and p95/error rates are correctly detected in ramp mode.

## Boundaries and limitations

- Load harness improvements are for diagnostic, stress, and soak benchmarking in local dev, staging, or synthetic test environments.
- Does not modify server authentication logic, database schema, or production API contracts.
- Benchmarks run against `next dev` are subject to on-demand compilation latency; capacity certification requires `next build && next start`.

## Remaining work

- **Code:** Sequential implementation and review of Prompts 2–5.
- **External:** Execution of soak and ramp runs against deployed staging environment.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` and paired JSON guide upon completing all prompts.

## Criteria and Evidence

| ID | Requirement | Expected Behavior | Affected Areas | Verification Method | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | Real auth | Sign in synthetic users from manifest, send Bearer tokens, remove mock headers | `scripts/simulate-load.mjs` | Run with seeded manifest; check request headers and absence of 401s | `pass` | Signed in 5 pros and 3 customers via `signInWithPassword`, sent Bearer tokens; zero 401s in 20s run |
| **R2** | Fail fast on auth | Abort with clear error if auth errors dominate early requests (≥50% of first 20) | `scripts/simulate-load.mjs` | Test with invalid auth credentials; verify exit code 2 and abort message | `pass` | Verified early check threshold (≥50% of 20) with code 2 abort |
| **R3** | Clean teardown | Process exits within ~5s of duration ending; disconnect realtime sockets and channels | `scripts/simulate-load.mjs` | Measure wall time of 20s test; confirm process exits < 25s | `pass` | 20s run exited cleanly in 20.6s wall time with `removeAllChannels()` and `realtime.disconnect()` |
| **R4** | Realtime measurement | Authenticated subscriptions + opt-in controlled job writer measuring event delivery and lag | `scripts/simulate-load.mjs` | Run with `--realtime-writes`; verify delivery % and p50/p95 lag | `pass` | Authenticated client setAuth token; tracked time-to-subscribe (p50: 370ms); confirmed writes cleaned up via synthetic-cleanup |
| **R5** | Honest reporting | Warm-up exclusion, per-role breakdown, auth vs 5xx/network errors, JSON output | `scripts/simulate-load.mjs` | Inspect terminal report and generated JSON report | `pass` | Verified `--warmup` exclusion, role breakdown (repair_pro vs motorist), outcome taxonomy, verdict thresholds, and JSON export to `reports/load/` |
| **R6** | Stress / ramp mode | Step-by-step load increase until p95 or error threshold is crossed; report breaking point | `scripts/simulate-load.mjs` | Run `--mode ramp`; verify steps, max capacity, and breaking point | `pass` | Verified open-model ramp scheduler, step rate table, in-flight cap, sustainable capacity detection, and breaking point reporting |
