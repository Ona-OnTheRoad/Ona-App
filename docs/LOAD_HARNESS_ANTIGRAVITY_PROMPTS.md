# Load Harness Improvement — Antigravity Prompts

Source: analysis of the first `scripts/simulate-load.mjs` run on 2026-10-22
(30 pros, 10 motorists, 30s, local `next dev`): 169 requests, 100% HTTP 401,
30 realtime subscriptions with 0 events, ~90s wall time for a 30s test.

Paste these into Antigravity **one at a time, in order**, and review each result
before sending the next. Each prompt is self-contained.

Notes:
- Prompts 3 and 5 write to / load the Supabase project in `.env.local`. Confirm it
  is a dev project, and run `node scripts/synthetic-cleanup.mjs` afterwards.
- Prompt 2 needs seeded users; a small seed is enough:
  `node scripts/synthetic-seed.mjs --customers 10 --pros 30`
  (the default is 500 customers / 56 pros).
- Every prompt ends with "show the diff, don't commit".

---

## Prompt 1 — Review guide and plan (no code yet)

```
Read AGENTS.md and docs/HANDOFF.md (plus the protected-file rules it references) before doing anything.

We are improving the load-test harness scripts/simulate-load.mjs. A first run (30 pros, 10 motorists, 30s against the local dev server) produced 169 requests with 100% HTTP 401, so it measured nothing. Root causes found:
- The script authenticates with "x-user-id" / "x-mock-role" headers, which nothing in src/ reads. /api/jobs uses requireUser() in src/lib/server/auth-utils.ts, which only accepts a Supabase Bearer access token. Do NOT add mock-header auth to the app; the fix belongs in the script.
- Realtime channels subscribe with the anon key and fake IDs (e.g. "syn-pro-1"), and nothing writes to jobs during the run, so "0 events" is guaranteed and proves nothing.
- channel.unsubscribe() leaves the Supabase socket open, so the process ran ~90s for a 30s test.
- Throughput is set by the script's fixed sleep timers (pros 10s/3s, motorists 5–8s), so this is a soak model, not a stress test.
- The latency report mixes dev-server compile warm-up with steady state, and counts 401s together with real server errors.

Task for this step only: create docs/review-guides/load-harness-auth-and-stress.md from docs/review-guides/TEMPLATE.md. Map each requirement in the list below to expected behavior, affected files, verification method, status (all "pending") and evidence. Keep code/test evidence separate from live-run evidence.

Requirements:
R1 Real auth: sign in synthetic users from the manifest, send Bearer tokens, remove mock headers.
R2 Fail fast on auth: abort with a clear message if auth errors dominate the early requests.
R3 Clean teardown: process exits within a few seconds of --duration.
R4 Realtime is meaningful: authenticated subscriptions plus a controlled job writer, measuring event delivery and lag.
R5 Honest reporting: warm-up exclusion, per-role breakdown, auth errors separate from 5xx/network errors, JSON report output.
R6 Stress/ramp mode: increase load step by step until a p95 or error-rate threshold is crossed, and report the breaking point.

Then show me the implementation plan and the review guide, and wait for my approval. Do not write feature code and do not commit.
```

---

## Prompt 2 — Real auth, fail-fast and clean teardown (R1–R3)

```
Implement R1–R3 from docs/review-guides/load-harness-auth-and-stress.md in scripts/simulate-load.mjs. Read AGENTS.md first. Do not modify anything under src/ for this.

Context:
- Synthetic users come from scripts/synthetic-seed.mjs, which writes tmp-audit/synthetic-manifest-latest.json (gitignored). Its shape is { runId, createdAt, password, customers: [{id, email, ...}], pros: [{id, email, service, lat, lng, ...}], errors }. All users share the top-level password.
- /api/jobs authenticates via requireUser() in src/lib/server/auth-utils.ts, which expects "Authorization: Bearer <supabase access token>".

R1:
- Remove the "fallback synthetic sessions" generator. If the manifest is missing or has fewer users than --pros/--motorists, exit with a clear message telling the user to run: node scripts/synthetic-seed.mjs --customers <n> --pros <n>
- Before the timed run starts, sign in each user once with the anon key (supabase.auth.signInWithPassword) using limited concurrency (e.g. 5 at a time). Print a sign-in summary (ok/failed). Exclude sign-in time from the run metrics.
- Send "Authorization: Bearer <access_token>" on every request. Delete the x-user-id / x-mock-role headers.
- Keep the token fresh if the run is longer than the token lifetime (use the session's refresh, or re-sign-in).

R2:
- Track 401/403 separately. If ≥50% of the first 20 requests are 401/403, abort the run, print "AUTH FAILURE: ..." with the likely cause, and exit with code 2.

R3:
- On stop, for every client: await client.removeAllChannels(), then client.realtime.disconnect(). Also make the abort-race listeners use { once: true } so they don't pile up.
- The process must exit within ~5s of --duration ending. Add a hard safety timeout that force-exits with a warning if teardown hangs.

Verify by running against the local dev server (http://localhost:3000) with a small seed, e.g. --pros 5 --motorists 3 --duration 20. Show me the output and the total wall time. Update the review guide's status/evidence for R1–R3. Show me the diff and wait; do not commit.
```

---

## Prompt 3 — Meaningful Realtime measurement (R4)

```
Implement R4 from docs/review-guides/load-harness-auth-and-stress.md in scripts/simulate-load.mjs. Read AGENTS.md and the protected-file rules in docs/HANDOFF.md first.

Problem: realtime subscriptions currently use the anon key with no user session, and nothing writes to the jobs table during the run, so "events received" is always 0.

Requirements:
- Each pro's Supabase client must be the signed-in client from R1 (or call client.realtime.setAuth(access_token)), so RLS-filtered postgres_changes on jobs (filter repair_pro_id=eq.<real uuid>) can actually deliver.
- Track subscribe outcomes separately: SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED, plus time-to-subscribe.
- Add an opt-in flag --realtime-writes <n> (default 0 = off). When on, a writer creates or updates n synthetic jobs spread across the run, targeting synthetic pros only (ids from the manifest), through the same API or path the real app uses (prefer POST /api/jobs as a signed-in synthetic motorist rather than direct service-role inserts, so we exercise the real path). Read the job store code before choosing.
- Each write records a timestamp. Pros record receipt time, and the report shows: events expected vs received, delivery %, and lag p50/p95/max.
- Writes must only touch synthetic users (emails @ona-local.test). Make sure scripts/synthetic-cleanup.mjs removes anything the writer creates; extend it if needed.
- Warn clearly at startup when --realtime-writes > 0 that it writes to the Supabase project in .env.local, and print the project URL.

Verify with a small run (--pros 5 --motorists 3 --duration 30 --realtime-writes 5), then run synthetic-cleanup and confirm the jobs are gone. Update the review guide evidence. Show me the diff and output; do not commit.
```

---

## Prompt 4 — Honest reporting (R5)

```
Implement R5 from docs/review-guides/load-harness-auth-and-stress.md in scripts/simulate-load.mjs. Read AGENTS.md first.

Requirements:
- Add --warmup <sec> (default 5). Requests started during warm-up are recorded but excluded from the headline latency/throughput stats; show warm-up stats separately.
- Break latency (min/avg/p50/p90/p95/p99/max) and counts down by role (repair_pro vs customer) as well as overall.
- Classify outcomes: success (2xx/3xx), auth (401/403), client (other 4xx), server (5xx), network (fetch threw / timeout). Report each separately. Do NOT record network failures as fake HTTP 500 as the script does now.
- Add a per-request timeout (--request-timeout-ms, default 10000) using AbortSignal.timeout.
- Throughput: compute from the measured window, and print a note that in the default soak mode throughput is set by poll intervals, not server capacity.
- Write a JSON report to reports/load/<timestamp>.json (args, environment target, base URL, git commit hash, all metrics). Check whether reports/ is the right place by looking at what's already there and at .gitignore; follow the existing convention.
- Print a short "verdict" section at the end: PASS/FAIL against configurable thresholds (--max-p95-ms default 1000, --max-error-rate default 1%).
- Print a warning when the base URL is a `next dev` server (detect localhost:3000 or add a --dev flag), since dev-mode latencies are not production-representative.

Verify with a short run against localhost:3000, show the console report and the JSON file. Update the review guide. Show the diff; do not commit.
```

---

## Prompt 5 — Stress/ramp mode (R6)

```
Implement R6 from docs/review-guides/load-harness-auth-and-stress.md in scripts/simulate-load.mjs. Read AGENTS.md first.

Current behavior is a soak test: fixed sleep intervals cap throughput (~5 req/s for 30 pros + 10 motorists), so it never finds a breaking point.

Requirements:
- Add --mode soak|ramp (default soak, which keeps current behavior).
- In ramp mode: run steps of --step-duration <sec> (default 20). Each step increases the target request rate (--start-rps default 5, --step-rps default 5, --max-rps default 100), spreading requests across the authenticated users round-robin. Use an open-model scheduler (fire on schedule, don't wait for the previous response) so slow responses show up as rising latency instead of silently lowering load.
- Cap in-flight requests (--max-inflight, default 200) and count requests dropped because of the cap.
- After each step print: target rps, achieved rps, p50/p95/p99, error breakdown (as in R5).
- Stop when p95 > --max-p95-ms or error rate > --max-error-rate for a step, or when --max-rps is reached. Report the last healthy step as "sustainable capacity" and the first failing step as "breaking point".
- Include per-step results in the JSON report from R5.
- Add a usage note in the file header: ramp results against `next dev` are not representative; for capacity numbers run against `next build && next start`.

Verify with a short ramp against localhost:3000 (e.g. --mode ramp --step-duration 10 --max-rps 30) and show the step table. Update the review guide, mark which criteria have code/test evidence versus live-run evidence, and list anything still unmet. Show the diff; do not commit.
```
