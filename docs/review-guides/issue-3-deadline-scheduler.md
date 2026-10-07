# Issue 3 review guide

## Goal

Pairing and armed negotiation deadlines are enforced by supported server scheduling without an open browser. Existing product deadlines and financial/assignment rules are preserved. This is report fix 3, not a GitHub issue.

## Review basis

Plan: [backend fixes status](../BACKEND_FIXES_STATUS.md). Machine-readable acceptance criteria and review evidence: [issue-3-deadline-scheduler.json](issue-3-deadline-scheduler.json). Feature implementation is in progress on `feat/unattended-deadline-sweeps`. Criteria remain pending until review; see [implementation and current evidence](../ISSUE_3_DEADLINE_SCHEDULER.md).

Current findings: checked-in sweeps run daily; negotiation expiry is implemented but negotiating rows are absent from the booked-job sweep query; several expire-stale operations execute outside its authorization check; pairing route text incorrectly describes a 66-second window while current rules use 144 seconds.

## Expected change areas

- `src/app/api/jobs/pairing-sweep/route.ts`: privileged scheduler entry point, accurate rule text and failure reporting.
- `src/app/api/jobs/expire-stale/route.ts`: authorization before mutations and explicit operation boundaries.
- `src/lib/server/jobs/job-store/expiry.ts`: bounded overdue armed-negotiation processing; preserve existing transition rules.
- Shared scheduler/auth helper and regression tests as needed; pairing engine only if an evidenced concurrency/failure gap requires a focused change.
- `vercel.json` or external scheduler configuration: supported cadence, reviewed against the actual hosting setup.
- Existing client sweep callers if compatibility must change: `src/lib/jobs/client.ts`, realtime/dashboard/job-flow and payment recovery callers.
- `docs/VERCEL_DEPLOY.md` and fix-status documentation: configuration, failure monitoring and rollout evidence.

These are expected areas, not a fixed file whitelist. Review any unexpected file change for scope. Do not embed scheduler secrets in browsers or guides.

## Reviewer procedure

1. Read the plan, protected-file rules and every JSON acceptance criterion before reviewing the diff.
2. Bind evidence to the exact reviewed commit SHA. For each criterion inspect code, tests and operational evidence described by its verification field.
3. Set status to `pass` only after verification; otherwise retain `pending` or use `fail`. Add precise file/test references and observed results to its evidence array. State blockers explicitly; never mark unrun live checks passed.
4. Manually inspect JSON criterion IDs, status and evidence; compare every agreed requirement against the guide. Run the documented lint, typecheck, tests and database fixture where applicable. Review automation is not installed.
5. Keep release criteria pending until observed deployment evidence exists. Human reviewers assess correctness and evidence quality; passing tests alone cannot complete the guide.

## Boundaries

This review does not certify Issue 2 live payment delivery, aggregate transactions (Issue 5), or all job persistence paths (Issue 4). If safe unattended execution depends on a gap in those areas, record and resolve that specific blocker rather than silently widening scope or claiming completion.
