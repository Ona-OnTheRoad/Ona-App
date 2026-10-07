# Issue 2: authenticated payment confirmation

## Completion record

The implementation and behavior are documented in [PAYMENT_CONFIRMATION_IMPLEMENTATION.md](../PAYMENT_CONFIRMATION_IMPLEMENTATION.md), with the original scope in [PAYMENT_CONFIRMATION_PLAN.md](../PAYMENT_CONFIRMATION_PLAN.md). Issue 2 is marked implemented; this guide tracks residual work separately from that implementation claim.

## Remaining work

### Code and review

- No additional Issue 2-only code change is currently identified. Recheck the payment confirmation path after changes to job persistence, transactional processing, and shared rate limiting; track any newly found gap under its owning issue.
- Keep the known cross-issue limits visible: aggregate payment/job atomicity belongs to Issue 5, broader guarded job writes to Issue 4, and distributed rate limiting to Issue 7.
- Historical held payment rows were not audited by this change. Define and document any required data-review procedure before treating those records as newly verified.

### External and release work

- Configure the test-account webhook secret, HTTPS endpoint and provider retries.
- Complete a browser-closed real test payment and duplicate notification/check-again exercise; verify exactly one durable booking.
- Verify delayed delivery, invalid authentication, provider outage and recovery on the dev deployment.
- Run authenticated browser smoke checks for bank transfer, callback, Call, Chat, Back and negotiation behavior.
- Record the environment and outcome for each check; mocked tests do not establish provider delivery or hosted behavior.

See the detailed checklist in [BACKEND_FIXES_STATUS.md](../BACKEND_FIXES_STATUS.md#issue-2-limitations-and-work-left) and the paired [remaining-work record](issue-2-payment-confirmation.json).
