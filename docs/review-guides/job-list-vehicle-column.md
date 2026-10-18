# Job-list vehicle column fix

## Goal

Fix the jobs 503 caused by selecting nonexistent `service_requests.vehicle_label`. User approved removing this column on 2026-10-18.

## Implementation plan

Remove only `vehicle_label` from `LEAN_JOB_COLUMNS`; retain `motorist_vehicle` and the mapper fallback for legacy row inputs. Check the configured database query, job-store regression tests, typecheck and lint. No schema or business/timer/assignment changes.

## Expected change areas

`src/lib/server/jobs/job-store/constants.ts` and this paired guide. The folder is protected; user explicitly approved this narrowly scoped select-list correction. Independent human review remains pending. Existing local changes, especially job polling pauses, stay separate and uncommitted.

## Reviewer procedure

Inspect one-line production diff and retained motorist_vehicle write/read path. Record database query evidence separately from automated local checks and authenticated endpoint smoke. Unrun checks stay pending.

## Boundaries and limitations

This removes the confirmed invalid column; other schema mismatches may still surface. No migration or mapper rewrite. No hosted deployment performed.

## Remaining work

Code: one-line implementation complete; 28 regression tests across 3 files passed, as did typecheck, targeted lint and diff check. Independent human review pending; full suite subsequently passed (see PR validation).
External: corrected configured-database projection succeeded (error=null, 0 jobs for Halim). Authenticated endpoint/browser smoke and hosted deployment remain pending.

## Closeout

Uncommitted; no backend report issue closure claimed.

## PR validation

Full isolated branch suite: 1,455 tests / 135 files passed; typecheck, lint (zero errors) and diff check passed. Independent human review remains pending; browser/hosted checks remain as listed above.
