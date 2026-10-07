# Issue 4: job persistence and conditional writes

## Goal

Make durable job rows authoritative, protect every job mutation from stale snapshots, and ensure a successful result means the complete intended write was saved. This follows Issue 4 in the engineer report’s suggested work order. See [BACKEND_FIXES_STATUS.md](../BACKEND_FIXES_STATUS.md).

## Proposed implementation plan

1. Inventory all `service_requests` writers, including job-store functions, API routes, database functions, scheduled work, and remaining client code. Identify each writer’s source snapshot and conflict behavior before changing persistence.
2. Add a monotonic job version to the database and job mapping/types. Define a single conditional persistence operation that matches both job ID and expected version, increments the version, and writes the complete requested patch.
3. Remove reduced-patch retries and memory-only write success. A database error must surface as a failure; a version conflict must be distinguishable from an infrastructure error. Update every job mutation to use the conditional operation or an equivalently guarded database function.
4. Remove the process-local job map as an authority or fallback. A failed database read must not return cached job state; missing durable database configuration must fail critical job reads and writes clearly.
5. Add and validate an idempotent migration, then review each call site against the criteria below. Preserve job state-machine, assignment, payment, fee, refund, and deadline rules.

## Expected change areas

- `src/lib/server/jobs/job-store/cache.ts`, `constants.ts`, `reads.ts`, `mappers.ts`, and `create.ts`.
- All `persist` / `persistIfUnchanged` call sites under `job-store/`, plus direct `service_requests` writers in API routes and pairing/deadline code.
- Existing database functions and migrations that mutate `service_requests`, including the Issue 3 timeout function.
- Job record types, row projections, fixtures and test doubles that represent persisted jobs.
- A new database migration and focused documentation/status updates.

The inventory decides the final file list. A search limited to `persist()` is insufficient because direct table updates and SQL functions also mutate jobs.

## Implementation recorded

- `supabase/migrations/20261007_079_job_version_cas.sql` adds `job_version` with a safe `0` default for existing rows and increments it on every update.
- `persist()` now writes a complete patch once with `job_version = expected`; it distinguishes a zero-row version conflict from a database failure. `persistIfUnchanged()` uses both version and `updated_at`, with no second unconditional write.
- Job creation fails when durable storage is unavailable and no longer retries inserts after dropping `motorist_vehicle`. Reads, lists and deadline sweeps no longer return or mutate jobs from a process-local map.
- Pairing, negotiation expiry, payment confirmation, care/admin updates, payout finalization and scheduled dispatch paths now use a version comparison or a narrow expected-state predicate.
- API errors carry 409 for version conflicts and 503 for durable-storage failures on the main job endpoints.
- `npm run typecheck` passed. `npm run lint` passed with 0 errors and 159 warnings. `npm test -- --reporter=dot` passed: 101 files and 1,209 tests; the additional scheduled-dispatch stale-CAS case is covered by a focused test. Formal review, hosted migration and runtime verification remain pending.

## Review criteria

Use the paired [JSON checklist](issue-4-job-persistence.json). In particular, verify complete writer coverage, conflict behavior, full-patch persistence, no memory authority, correct migration behavior, and preservation of protected business rules. Keep code evidence separate from hosted migration and deployment evidence.

## Boundaries and limitations

- Issue 5 owns atomic multi-row job/payment/event transitions and making `getJob` pure. Issue 4 must not imply that independent writes are transactional.
- Issue 6 owns broad structured logging and operational visibility; Issue 4 still needs actionable failure results and must not swallow persistence failures.
- Issue 7 owns distributed rate limiting and broader server-only guard work.
- Historical records need a safe initial version value. Any writer that does not advance the version can weaken the guarantee, so the audit must include SQL and direct updates.
- Hosted migration `20261007_079_job_version_cas.sql` was applied to the configured Supabase project on 2026-10-07. Verification found the non-null `job_version` column, enabled version-bump trigger, migration ledger entry, and zero null versions. Isolated-database reapplication and runtime checks remain pending.

## Reviewer procedure

Review the exact implementation commit and trace every writer from its snapshot to its persisted predicate. Verify each checklist item against code and recorded test evidence. Do not mark migration, hosted behavior, or production rollout as passed without direct evidence.
