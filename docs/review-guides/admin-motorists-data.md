# Admin Motorists data loading — review guide

## Goal

Replace the `/admin/motorists` placeholder with authenticated data loading, following the approved Pros fix. User requested the same correction on 2026-10-18.

## Implementation plan

Fetch `/api/admin/users?role=motorist` after admin readiness. Show name, contact, location and account status using existing admin table styles. Provide loading, error, empty and manual-refresh states without recurring polling.

## Expected change areas

`src/app/admin/motorists/page.tsx`, focused page tests and this paired guide. Backend, schema, protected files, detail actions and consumer UI are excluded. Local job-polling pauses remain separate uncommitted work.

## Reviewer procedure

Verify auth gating, endpoint/query, pending request, populated rows, missing optional fields, failures versus empty results and manual retry. Match criteria in the paired JSON against the reviewed diff. Keep local code evidence separate from authenticated browser and hosted checks.

## Boundaries and limitations

The existing API selects profiles with primary role `motorist`, limited to 300 recent users. This does not claim to include every dual-role customer or provide pagination. No new mutations or endpoint changes.

## Remaining work

Code: implementation complete. 27 tests across motorists/pros pages and users endpoint passed; typecheck, targeted lint and diff check passed. Independent review pending; full suite not rerun.
External: authenticated browser smoke against configured database and hosted verification pending.

## Closeout

Reviewed commit pending; no commit requested. No numbered backend report issue is closed by this UI fix. Unrun checks stay pending.

## Local evidence

Four motorists page tests cover auth readiness, endpoint/filter, populated rows, optional fields, inactive accounts, loading, auth network errors and failure-to-empty recovery through manual refresh. Existing Pros and endpoint checks also pass. Authenticated browser/database and hosted checks remain pending.

## PR validation

Grouped with the other admin directory loading fix. In the isolated branch checkout, all 1,463 tests / 137 files passed; typecheck, lint (zero errors; no warnings in changed files) and diff check passed. Independent human review and authenticated browser/hosted smoke remain pending. No recurring polling or review/approval controls added.
