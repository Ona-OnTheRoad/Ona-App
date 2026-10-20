# Job-update baseline: inventory and capture procedure

Baseline: `70cbae84471201e9c5cac60a9fc307732de899c1` (dev, after pairing/checkout/poll recovery). This phase measures the existing paths; it does not coordinate them or alter intervals. [Review criteria](../review-guides/live-updates-phase1-baseline.md).

## Source inventory

All intervals below are existing nominal schedules. Hidden-tab behavior, initial fetches, debounce, coalescing and request time can change actual counts. A visual countdown is not a network request.

| Source label | Entry points | Existing triggers/schedule | Measured resource |
| --- | --- | --- | --- |
| `job-screen` | `use-job-poll`, `use-job-load` | Initial/status transition; pairing 1s, negotiating/searching/agreed 8s, active/completed 15s, released/satisfied 45s, other loaded 60s, missing 2s; realtime | `job` |
| `job-screen` | `use-job-guards` | Negotiation 20s; focus and visibility events | `job` (shared loader) |
| `job-screen` | `use-job-sweep`, pairing countdown callback | Entry and 180s; pending payout 45s; local pairing-deadline expiry | `expire-stale`, `pairing-sweep`; follow-up `job` |
| `cloud-store` | `use-cloud-data`, `use-cloud-realtime` | Post-auth 900ms; realtime debounce 800ms; backup 120s; visible tab | `requests` (separate legacy list API) |
| `cloud-store` | `use-cloud-realtime` | First stale sweep after 12s; subsequent sweep at least 240s, checked on 120s ticks | `expire-stale` |
| `incoming` | `use-incoming-poll` | Mount; visible status 1s, full lean list every few cycles; idle 3s; realtime/visibility; one pending rerun | `incoming-status`, `jobs` |
| `incoming` | `use-incoming-queue` | Detail hydration when a card surfaces | `job` (`action`) |
| `dashboard` | `use-dashboard-jobs` | Initial; backup 240s; realtime debounce 150ms; pending refresh coalesced | `jobs` |
| `dashboard` | Expiry watcher | Local clock every 1s while incoming cards exist; network only when a deadline expires | `pairing-sweep` (`maintenance`) |
| `release` | `use-release-pay-gate` | Initial and 30s; stale sweep at most every 120s | `jobs`, `expire-stale` |
| `callout` | `use-job-callout` | Initial and 3s retry until terminal quote; mount/status changes restart the effect | `callout` |
| `discovery` | `use-motorist-jobs-by-pro` | Initial microtask; 45s backup; visibility; explicit refresh | `jobs` |
| `past-jobs` | `use-pro-past-jobs` | Initial; 120s; visibility; backup stale sweep before reads | `jobs`, `expire-stale` |
| `requests-page` | Customer `/requests` | Initial; 180s; backup stale sweep before reads | `jobs`, `expire-stale` |
| `history` | Customer `/history` | Initial dependency change | `jobs` |
| `job-entry` | `/jobs/[id]` page bootstrap | Initial route/session load before the flow screen | `job` |
| `request-detail` | `use-request-detail` | Initial dependency change | `job` |
| `chat` | `use-chat-job-status` | Initial; 45s while visible | `job` |
| `notification` | Notification open | Explicit user action | `job` |
| `checkout` | Checkout load/retry/cancel/recheck; bank-pay polling | Initial; explicit actions and expiry; bank-pay read every 4s | `job`, expiry `expire-stale` |
| `job-action` | Release/transition recovery | Existing delayed read-back/retry loops | `job` (`retry`) |
| `other` | Compatibility/default argument | Future or untagged external callers | Known resource with `unknown` trigger; investigate before interpreting totals |

`backendSubscribeJobs` still opens one channel **per caller**, with the existing customer/pro row filters. This phase labels channels opened by cloud store, job screen, dashboard and incoming panel; it deliberately does not share them. The existing `app-api.ts` implementation retains those filters, callbacks and cleanup.

The job client's existing HTTP 401 refresh/retry and the job read's existing bounded auth retry are labeled `retry`; existing timers and retry counts are unchanged. Initial snapshot calls can also be triggered by hook dependency/status changes, rather than only a cold page load.

## Coverage boundaries

This inventory covers job snapshot/list/status/call-out reads, their job subscriptions, and the two job-maintenance API families. It is **not total app traffic**. Existing write actions (location uploads, offers, transitions, payment verification, etc.), presence/marketplace, chat-message and notification feeds are not included in diagnostic HTTP totals. For example, the bank-pay loop also posts to `/api/payments/verify`; that traffic must be included separately in a full checkout cost study. Do not run real financial actions to generate measurement traffic.

Resource concurrency is aggregated within this tab, across sources. It can reveal overlapping reads but cannot prove two reads concern the same job, because no job/user IDs are retained. Use a controlled one-job scenario when investigating duplication. Two tabs each have an independent capture; there is no cross-tab coordination or aggregation.

## Enable and inspect a local capture

1. Run the application normally and sign in to an authorized test account. Open the relevant screen, then open that tab's developer console. Diagnostics are off after a full reload; start after loading the module/screen. A capture started here cannot retroactively measure initial requests or a channel that was already subscribed. A hot module replacement may also reset the capture; use a stable build when recording a baseline.
2. Start one scenario:

   ```js
   window.onaJobDiagnostics.start("trip")
   ```

   Supported labels: `idle`, `pairing`, `negotiation`, `trip`, `hidden`, `reconnect`, `two-tabs`, `unspecified`. There is no arbitrary free-text label. Navigate within the same tab after starting to capture initial loads/channel readiness; a full document reload ends the capture.
3. Perform the controlled scenario for a recorded duration. Then stop and inspect:

   ```js
   window.onaJobDiagnostics.stop()
   console.table(window.onaJobDiagnostics.snapshot().groups)
   JSON.stringify(window.onaJobDiagnostics.snapshot(), null, 2)
   ```

4. Keep exports locally. They contain fixed labels and numeric counters only. There is no storage, logging/upload endpoint, additional polling, PerformanceObserver or diagnostic interval. `clear()` discards the buffer. The buffer holds at most 1,000 events and reports drops; if `dropped > 0`, shorten the scenario and recapture before calculating rates. Summary counts/percentiles describe retained **completed** samples, not an all-time counter. `inFlight` shows requests/spans begun in this capture that have not finished; stopping/clearing invalidates unfinished spans.
5. Optional server stage timing: set `JOB_READ_TIMING_ENABLED=true` in the server environment and restart that dev server. Only job-detail GET/POST responses add `Server-Timing: auth;dur=…,job_load;dur=…,callout;dur=…`. Default is off. Restore false afterward. No client request header, auth bypass or public timing endpoint is introduced.

### How to interpret the numbers

- `http` counts actual existing fetch attempts, including auth retries, to response headers. It excludes auth-session waiting before fetch, body parsing, rendering and uninstrumented endpoints. A missing `Content-Length` is unknown; zero is recorded only when supplied. Header bytes are declared HTTP response bytes, not browser decompressed payload or total wire transfer. Bodies are never cloned or read to measure size.
- `refresh` measures the job-screen logical read (including session/parse/commit work) or cloud-store refresh promise. It is **not an additional HTTP request**. The legacy store wrapper swallows read failures into an empty array, so its resolved refresh span alone is not proof of successful data reconciliation: consult its HTTP outcome.
- `trigger` counts attempted refresh notifications/coalesced calls; do not add it to HTTP counts. Realtime can cause a single read to serve several notifications.
- Lifecycle records include open, subscribed, event, channel error, timeout, closed and removed. They contain neither channel names nor row payloads. Starting midway through a channel lifetime produces an incomplete lifecycle; record that limitation. Reconnect count/connection readiness must be assessed from the observed lifecycle sequence, not from an invented healthy flag.
- `p95EventToResponseMs` is measured from the most recent observed event for that **source** at read start to successful response/read completion, including source debounce when captured. Events from several jobs/channels may share a source. It is not proof the returned revision includes that event, true commit-to-screen latency, or render completion. Controlled synthetic/version-aware browser evidence is required for those stronger claims. Unknown metrics remain null/absent.
- Server `auth`, aggregate `job_load` (which already includes contact and quote hydration), and additional `callout` resolution are separate stage timings. They exclude body parsing before those stages and response serialization afterward. They do not identify individual SQL query time; obtain that separately from approved hosted database observability.

## Repeatable scenario matrix

Use authorized synthetic test jobs without triggering financial effects. Record baseline commit, label, role/state, tab count, capture start/stop, network conditions, retained/dropped count, whether channel readiness was observed, and endpoints outside coverage. Do not include account IDs, job IDs, coordinates or credentials in the evidence artifact.

| Scenario | Procedure | Inspect |
| --- | --- | --- |
| Idle | Start capture, navigate to role home; leave visible for 120s | List/maintenance source counts; channels observed |
| Pairing | Capture a disposable test request's waiting/reserved states | Status/detail/list reads, coalescing and local countdown versus network ticks |
| Negotiation | Observe a confirmed, unpaid test negotiation and a harmless offer update | Realtime-triggered read delay; 8s/20s recovery callers |
| Trip | Use an existing authorized synthetic trip; do not start/pay a real job | Stable 15s read cadence; separate GPS write traffic |
| Hidden | Capture a known screen, hide for 60s, return | Existing hidden-tab behavior by source; visibility reconciliation; note any in-flight read |
| Reconnect | Disconnect for 30s then restore the same tab | Lifecycle failure/readiness sequence, existing recovery requests and timeouts; no assumed SLA |
| Two tabs | Separate labeled captures for the same synthetic workflow | Per-tab channel/read counts; report both captures without pretending they are one coordinated stream |

For each observed request family, report count / **known capture duration**, duration p50/p95 if available, known byte sample count, HTTP errors/timeouts, and missing measurements. Use the captured raw numeric samples for p50; the provided group summary includes p95. Do not compute a network rate from a truncated buffer or infer hosted savings from a short fixture.

## Targets and evidence status

Candidate later-phase targets remain proposals: p95 healthy realtime-receipt-to-reconciled-snapshot ≤2s and reconnect-to-reconciled-snapshot ≤5s. This collector's event-to-response proxy alone cannot certify them. Recovery/deadline targets and an infrastructure budget require agreement after baseline observation and hosted capacity review. No thresholds or quotas are claimed verified here.

Deterministic automated scenarios validate measurement attribution and unchanged request/timer counts. They are synthetic test evidence, not measurements of real users or production latency. Authenticated representative captures, Supabase auth/publication/quota/query inspection, actual scheduler delivery and cost/scale evidence remain pending. Phase 1 is not complete until those observations and targets are reviewed.

Subscription callback reference checked during implementation: [Supabase JavaScript subscribe](https://supabase.com/docs/reference/javascript/subscribe). Only fixed status categories are retained; raw SDK errors are intentionally excluded from diagnostics.

Local implementation checks: 1,606 tests / 165 files, typecheck, lint (0 errors / 139 warnings), server-boundary guard, whitespace check and webpack production build passed. Default Turbopack compilation hit environment restrictions (font network, then worker port) and is not claimed verified. These are code checks, not representative authenticated baseline data.

## Phase 2A capture interpretation

After the shared-subscription change, `subscription/shared-jobs` measures the physical job channel lifecycle and received events. `subscription-consumer/<source>` measures listener registration, delivery, errors and cleanup; it also provides the source event timestamp for event-to-read proxies. One received event can produce several consumer-delivery records. Count physical `opened` records for channel creation, and do not add consumer records to that count. Earlier Phase 1 captures used per-caller channels and are a different schema/ownership baseline. Channel removal is asynchronous at the SDK; an inactive retiring channel may briefly overlap a newly opened replacement, while its callbacks are ignored.
