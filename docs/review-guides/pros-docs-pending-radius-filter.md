# Docs-pending Pro Radius Filter Review Guide

## Goal

Repair Pros whose identity / qualification documents are still pending verification (`under_review`) or have been `rejected` must be capped to `DOCS_PENDING_MAX_RADIUS_KM` (2.0 km) on the public discovery API (`/api/pros`), rather than appearing up to the standard marketplace radius (5.75 km).

This closes the pre-existing defect tracked as `docs-pending-radius-cap-enforced` in `docs/review-guides/supabase-core-separation.json` and noted in `docs/review-guides/supabase-core-separation.md`.

## Expected change areas

- `src/app/api/pros/route.ts`: enforce `DOCS_PENDING_MAX_RADIUS_KM` (2 km) when `t.docsStatus === "under_review" || t.docsStatus === "rejected"`. Approved and unreviewed/standard pros keep `MAX_RADIUS_KM + 0.75` (5.75 km).
- `src/app/api/pros/__tests__/route.test.ts`: test route characterization covering docs pending vs approved distance filtering, heartbeat, and response metadata.
- `docs/review-guides/supabase-core-separation.json` & `.md`: update tracked defect status.

## Reviewer procedure

Inspect each requirement in `pros-docs-pending-radius-filter.json` against the reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

| ID | Requirement | Expected behaviour | Verification | Evidence |
|---|---|---|---|---|
| R1 | Docs-pending cap enforced | Pros with `docs_status` `under_review` or `rejected` beyond 2.0 km are excluded | Route test with pros at 1.5 km and 2.5 km | code |
| R2 | Approved / standard radius preserved | Pros with `docs_status` `approved` or null/none up to 5.75 km are included | Route test with pro at 3.5 km | code |
| R3 | Response meta accurate | `meta.docsPendingRadiusKm` is 2 and matches the filter behavior | Route test | code |
| R4 | No regressions | Route, auth, matching tests pass; typecheck and lint pass | Automated commands | code |

## Boundaries and limitations

- Live geolocation queries still rely on incoming client coordinates and database stored pro pins.
- Does not alter SSPE dispatch pairing logic, which has separate candidate filters.

## Remaining work

- Code: None once tests pass.
- External: Verification in deployed environment with live test accounts.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` and `docs/review-guides/supabase-core-separation.json`.
