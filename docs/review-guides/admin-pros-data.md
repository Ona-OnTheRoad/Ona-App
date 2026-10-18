# Admin Pros data loading — review guide

## Goal

Replace the placeholder at `/admin/pros` with the existing authenticated pro listing. User approved the plan on 2026-10-18.

## Approved plan

Fetch `/api/admin/users?role=repair_pro` after the admin gate is ready. Render name, contact, location, trade, status and verification using existing admin styles. Provide loading, error, empty and manual-refresh states; no recurring polling.

## Expected change areas

`src/app/admin/pros/page.tsx`, focused page tests, and this paired guide. Existing endpoint, identity service, schema, protected files and consumer UI stay outside implementation scope. Local uncommitted polling pauses are separate work.

## Reviewer procedure

Check the paired criteria against the resulting diff/commit. Exercise delayed auth, populated/empty responses, errors and refresh. Record local automated evidence separately from authenticated browser/deployment evidence. Never mark unrun checks passed.

## Boundaries and limitations

Read-only listing; no new management actions or backend changes. Existing API caps results at 400 pro profiles, includes dual-role accounts and preserves existing fallback/error semantics. No pagination is claimed.

## Remaining work

Code: implementation complete; 4 focused page tests plus 19 existing endpoint tests passed. Typecheck and diff check passed. Lint passed with 0 errors / 152 warnings, none in admin/pros. Independent review pending. Full suite not rerun.
External: authenticated browser smoke against configured database and hosted verification pending.

## Closeout

Reviewed commit: pending; no commit requested. This UI fix is separate from the numbered backend report ledger; no backend issue closure is claimed.

## Local evidence

The page requests the pro-filtered endpoint only after readiness, displays account/contact/location/trade/status/verification fields, and offers manual refresh. Focused tests cover delayed auth, dual-role rows, optional fields, pending requests, failure versus empty states, retry and auth network failure. Backend and protected files were not changed by this fix. Hosted and authenticated browser checks have not been run.

## PR validation

Grouped with the other admin directory loading fix. In the isolated branch checkout, all 1,463 tests / 137 files passed; typecheck, lint (zero errors; no warnings in changed files) and diff check passed. Independent human review and authenticated browser/hosted smoke remain pending. No recurring polling or review/approval controls added.
