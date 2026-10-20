# Checkout snapshot refresh review guide

## Goal

Fix checkout failing with “Job changed while checkout was being created” when its own call-out classification updates the job. Plan approved in conversation on 2026-10-19: refresh and revalidate after preparation, preserve conditional binding, and cover genuine conflicts and competing attempts.

## Expected change areas

- Job-store payment start: refresh after call-out preparation and before provider creation.
- Narrow payment snapshot validation helper and regression tests.
- Preserve fees, timers, assignment rules, confirmation and payout behavior. The user authorized this focused change to the protected payment-start code; do not regenerate the module.

## Reviewer procedure

Review the paired JSON criteria against the final diff. Baseline: `5bf2dfb087734b0da75fcb608211a331f56e73c1`; work is uncommitted and the workspace contains unrelated changes.

Code checks and live deployment evidence are separate. Unrun checks stay pending.

## Boundaries and limitations

No migration or UI change planned. Existing failed checkout intents are not repaired or deleted. Full payment-start idempotency and external provider transaction atomicity are outside this fix; competing attempts must still pass the existing conditional bind.

## Remaining work

Code: implementation complete; independent human review pending. Regression tests cover the preparation version bump, pre-provider cancellation/price/party/currency/association changes, cancel/reopen history, missing jobs, late cancellation and guarded competing binds. These are mocked provider/database unit checks, not a live contention test.

Verification: `npm test` passed 1,500 tests / 142 files; `npm run typecheck` passed; `npm run lint` passed with 0 errors / 145 warnings, existing unused-function warnings remain in payments.ts; new helper/tests have no warnings; `git diff --check` passed. Fee and timer implementation unchanged. Evidence logs: `/private/tmp/ona-checkout-{tests,typecheck,lint}.log` (session-local).

External: authenticated localhost checkout smoke and hosted deployment verification pending. Do not initiate a real payment during automated verification.

## Closeout

Uncommitted change on the recorded baseline. No migration/configuration step required. Authenticated localhost smoke, independent review and hosted rollout remain pending; do not call the deployed issue closed.
