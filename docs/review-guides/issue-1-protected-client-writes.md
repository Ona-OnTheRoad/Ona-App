# Issue 1: protected client writes and job transition API

## Completion record

The backend report’s first work item was committed as `08cb5c7`. Migration `20261004_077_lock_client_writes.sql` was reported applied and verified on the dev Supabase project. The source plan is summarized in [BACKEND_FIXES_STATUS.md](../BACKEND_FIXES_STATUS.md); the contemporaneous mutation inventory is in commit `08cb5c7` as `docs/MUTATION_INVENTORY.md`.

## Remaining work

### Code and review

- Re-audit the current source against the Issue 1 requirements: direct client writes to protected job/profile tables must remain blocked, while approved presence updates remain usable.
- Confirm the existing desk transition helper still routes status changes through the server transition API. The report named `backendUpdateJobStatus`; that exact symbol is not present in the current source, so verify the equivalent call path instead of treating the historical name as proof of a gap.
- Record a current independent review and regression-test evidence. If the audit finds a direct-client mutation bypass, fix it under a scoped follow-up and link it here.

### External and release work

- Dev application of migration 077 is recorded in [PAYMENT_CONFIRMATION_PLAN.md](../PAYMENT_CONFIRMATION_PLAN.md). Production application/verification is not established; verify the target production policy and trigger state before describing rollout as complete.

## Limitations

The original report and mutation inventory are point-in-time artifacts. They do not establish current hosted grants, policies, trigger state, or production behavior. See the paired [remaining-work record](issue-1-protected-client-writes.json).
