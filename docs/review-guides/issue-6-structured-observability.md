# Issue 6: structured logging and error visibility

## Goal

Make failures in payment and job workflows diagnosable from server logs without exposing internal error details to clients. Correlate each API request with a stable request ID, emit consistent structured events, and preserve typed, expected client errors. This addresses Issue 6 in the backend engineer review report and the remaining work recorded in [BACKEND_FIXES_STATUS.md](../BACKEND_FIXES_STATUS.md).

## Proposed implementation plan

1. **Inventory the current logging and error boundaries.** Recount empty catches, raw 500 messages, and console calls under `src/app/api` and `src/lib/server`; trace the payment and job paths affected by Issues 4 and 5. Record existing typed error contracts and fields that must never be logged (credentials, tokens, payment payloads, personal data). Do not broaden to all 227 historical empty catches without path-by-path review.
2. **Define request correlation.** Specify how an incoming request ID is validated or generated, how it is returned to callers, and how it reaches route handlers and server services. Treat client-supplied IDs as untrusted input: constrain length/characters and never let them override unrelated tracing/security headers. Confirm behavior across middleware, route handlers, and the deployed Next/Vercel runtime.
3. **Add a small server-only structured logger.** Emit one JSON object per event with severity, stable event name, timestamp, request ID when available, and safe error metadata (error class/code and stack only in server logs). Add explicit redaction/allowlist rules. Keep browser logging separate and avoid adding an external telemetry SDK until its hosting/configuration and data-handling requirements are confirmed.
4. **Migrate high-risk payment/job paths first.** Replace ad hoc console calls and swallowed catches in payment confirmation, refund/payout, job transitions, retry/recovery, and the corresponding API routes. Expected typed/auth/validation failures retain their established status and public message; unknown failures return generic 5xx responses while full diagnostic context stays in server logs. Preserve transaction and retry behavior from Issue 5.
5. **Validate with focused tests and a staged rollout.** Test request-ID propagation/generation, response headers, JSON shape, redaction, typed errors, generic unknown 5xx behavior, and logging on caught failures. Verify logs from a deployed non-production request and decide separately whether to integrate Sentry/OpenTelemetry, including DSN/secret setup, sampling, retention, and alert ownership.

## Expected change areas

- `src/middleware.ts` or a shared API response/request-context layer for request-ID propagation, depending on Next.js runtime constraints.
- A new server-only module under `src/lib/server/` for structured logging, safe error normalization, and request context.
- Payment routes and services under `src/app/api/payments/` and `src/lib/server/payments/`, prioritizing confirmation, refund, payout, and retry failures.
- Job routes and services under `src/app/api/jobs/` and `src/lib/server/jobs/`, prioritizing transitions, expiry, retry, and recovery.
- Focused unit/API tests for correlation, redaction, response safety, and behavior-preserving error mapping.
- This guide and `docs/BACKEND_FIXES_STATUS.md` for evidence, rollout decisions, and remaining coverage.

Exact files depend on the inventory and runtime checks. Do not mechanically replace every `console.*` or empty catch in the repository; client-side logs, best-effort cleanup, and catches with deliberate fallback behavior need separate treatment.

## Review criteria

Use the paired [JSON checklist](issue-6-structured-observability.json). Review the exact implementation commit and distinguish code-level evidence from hosted log/alert evidence. Never mark an integration or production configuration as complete based only on local tests.

## Boundaries and limitations

- Initial scope is high-risk payment and job paths, not a blanket rewrite of every catch/log call. The historical report counts are a starting point, not a verified current baseline.
- A request ID provides correlation, not distributed tracing. Cross-service trace propagation needs an explicit format and compatible instrumentation.
- Structured logs cannot guarantee capture if the hosting platform drops, truncates, or expires them. Hosted retention, search, alerting, and access controls need environment-specific verification.
- No Sentry or OpenTelemetry dependency/configuration is currently evident in `package.json`; adopting one adds vendor/configuration, sampling, privacy, and operational ownership decisions.
- Logs must exclude secrets, authorization material, raw provider responses, and unnecessary payment/customer data. The initial logger omits exception messages and stacks entirely; a future error-reporting integration must define server-side scrubbing, access, and retention before collecting them.
- Omitting exception details reduces diagnostic depth. Stable event names, safe error class/code, request/job/payment IDs, and platform metadata help isolate failures, but recurring or ambiguous failures may require a configured error-monitoring provider.
- Never return raw unknown exception messages to API clients. Preserve intentional typed errors and established validation/auth responses.
- This issue improves visibility; it does not add automatic retries, change transaction boundaries, or prove that asynchronous work completes.

## Current status

Implementation is in progress on `feat/issue-6-structured-observability`. Middleware now accepts only bounded safe request IDs or generates a UUID, forwards the ID to route code, and returns it in the response header. A structured server logger emits JSON with stable event names, severity, request correlation when passed by API handlers, allowlisted context, and safe error class/code metadata; it omits untrusted exception messages and stacks entirely. Payment confirmation/init/refund/history/release/job payment, webhook failures, and job create/read/transition/dispatch/expiry/retry/status/rating/appeal/dispute/recommendation API failures now use structured events and generic 5xx messages. `apiFailFromError` preserves explicit typed status codes while hiding 5xx details. Several lower-level payment and job services still use legacy console logging; migrating those safely with request context is outstanding.

Local tests cover safe logger output, request-ID generation/propagation, malformed request-ID rejection, omission of unsafe exception messages, and generic internal API errors. Full validation passes: 102 test files / 1,205 tests, typecheck, and lint with zero errors (158 repository warnings). Sentry/OpenTelemetry is not added. Hosted request correlation, log retention/access, and monitoring delivery remain pending.
