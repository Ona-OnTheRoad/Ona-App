# Issue 6 follow-up: payment and job service logging

## Goal

Finish the lower-level observability work left by Issue 6 / PR #6 after Issue 7 is merged. This is a proposed implementation plan prepared on 2026-10-07; feature code has not started. See the parent [Issue 6 guide](issue-6-structured-observability.md).

## Proposed implementation plan

1. Inventory raw console calls and suppressed errors in payment confirmation, escrow/refund/payout providers, durable payment processing, job persistence/transitions/expiry/recovery and deadline services. Classify critical errors versus expected control flow and intentional best-effort cleanup; record explicit deferrals.
2. Replace scoped raw service logs with stable structured events and allowlisted operation/job/payment/provider context. Do not log exception messages/stacks, raw provider payloads, secrets or personal data. Carry validated request IDs when a request context exists; independently scheduled workers use stable operation and record identifiers.
3. Add logs at critical suppressed-error boundaries while preserving return values, retry/claim/transaction behavior, expected client errors and intentional cleanup semantics. Protected payout/job files receive observability edits only, with tests and human review. No fee, assignment or timer changes.
4. Add failure-injection tests for scoped services and route-to-service behavior. Run relevant money/job regressions and all repository gates, then update this guide, the parent checklist and status ledger against the implementation commit.

## Expected change areas

`src/lib/server/payments/`, `src/lib/server/jobs/job-store/`, deadline services, the shared logger/request context where necessary, selected API callers and tests. Initial audit identifies raw confirmation, payout, escrow, persistence, expiry and recovery logs. Exact files and deferrals must follow the inventory rather than mechanical repository-wide replacement.

## Reviewer procedure

Use the paired JSON checklist. Inject provider/database/worker failures; inspect stable JSON events and privacy exclusions; verify original statuses, payment state, leases, retry results and transactional behavior are unchanged. Verify contextual request IDs where supplied. Keep code evidence separate from non-production hosted correlation, access, retention and monitoring evidence.

## Boundaries and limitations

No new telemetry vendor or UI work. Independent review and protected-file review remain required. Lower-level services invoked by workers do not inherently have an HTTP request ID. Do not imply distributed tracing or guaranteed platform log retention. Hosted checks and Sentry/OpenTelemetry decisions stay in the parent Issue 6 guide.

## Remaining work

Code: inventory, implementation, injected-failure tests, regression checks and formal commit review pending.
External: non-production log correlation, retention/access verification and monitoring ownership remain pending in the parent guide.

## Closeout

Reviewed commit: pending. Reconcile this checklist with the parent Issue 6 guide and BACKEND_FIXES_STATUS.md. Unrun checks stay pending.

## Plan publication checks (2026-10-18)

Documentation-only PR: no logging implementation or runtime changes. Full baseline suite passed (1,455 tests / 135 files), typecheck and lint passed (0 errors / 160 existing warnings), and diff check passed. Implementation criteria above remain pending; publishing this plan does not complete Issue 6.
