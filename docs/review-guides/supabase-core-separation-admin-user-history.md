# Admin user-detail history separation — review guide

## Goal

Remove the four direct history queries from GET `/api/admin/users/[id]` while preserving its current observable behaviour. Follow-up to [Stage 4 Slice 5](supabase-core-separation-stage-4-slice-5.md), batch 4. Baseline: `b3c71fd`; user approved this plan and criteria with “do it.” on 2026-10-11. Implementation is locally complete; committed with this guide. Exact-commit independent review remains pending.

## Approved implementation plan

1. Introduce a server-only admin reporting module at `src/lib/server/admin/user-history.ts`. This cross-domain read model owns its service client internally and exposes a typed reader with jobs, bookings, payments and reviews operations. No client or SDK response type crosses the route-facing interface.
2. Create the history reader only after the shared-profile success/existence guard. Replace the four query chains with named operations in the existing seven-way parallel phase. Keep identity in its own reader and HTTP/auth/configuration handling in the route.
3. Preserve query projections, both-role filters, descending creation order, limits (50 jobs, 30 bookings, 30 payments, 20 reviews), response fields, null-to-empty-array defaults, returned-error handling and thrown-error handling.
4. Verify existing route characterization tests against the baseline and extracted implementation. Add focused cases where needed for all four history failures and secondary-phase concurrency. Run lint, typecheck, full tests and diff checks.

## Expected change areas

- `src/app/api/admin/users/[id]/route.ts`
- New `src/lib/server/admin/user-history.ts`
- Existing route characterization tests and focused history verification as needed
- This paired review guide and relevant parent-guide scope/residual records

## Reviewer procedure

Use the paired JSON requirements against the exact implementation commit. Compare query chains and query start ordering to the baseline; record local checks separately from hosted evidence. Passed and pending criteria are recorded separately in the paired JSON.

## Boundaries and limitations

Read-only separation. No schema, configuration, UI, fee/assignment/timer, protected-file or mutation changes. Other admin/Care routes and identity signup/OTP/lifecycle batches are excluded. Existing returned history query errors can appear as empty arrays; preserve and explicitly track this limitation, rather than changing error semantics in this extraction. Scripted database tests do not establish hosted schema/policy behaviour.

## Remaining work

Code: independently review the exact implementation commit. No migration/schema/config/UI/protected changes required, confirmed by changed-file inspection. Parent guides updated; broader Stage 4 and later identity batches remain open.

External: deploy the reviewed commit and record authorized admin-detail smoke for both roles, populated/empty histories, missing user and non-admin rejection.

## Closeout

Reviewed commit: pending. This belongs to the separate Supabase separation effort, not the numbered backend report ledger. Update its parent guides without marking broader Stage 4 complete. Record actual remaining work and limitations at the reviewed commit.

## Local implementation and verification

Implemented the four named operations in a 58-line server-only admin reporting module. Route retains its guards and seven-way parallel phase and has no direct database/client calls. All 24 route characterization tests passed before and after extraction, including 9 additional failure/default/guard cases. Full suite: 1,455 tests / 135 files passed; typecheck passed. Query/source comparison found no extraction regression. Lint passed with 0 errors / 160 existing warnings, none in changed files; `git diff --check` passed. Exact-commit independent review and hosted checks remain pending.
