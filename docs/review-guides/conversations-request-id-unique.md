# Conversations request_id uniqueness review guide

## Goal

At most one conversation per service request (`request_id`), so concurrent Message taps cannot create split threads. User approved the unique-index + ensure race-recovery plan on 2026-11-04 (“carry on”).

## Expected change areas

- Migration `083` — dedupe existing rows (keep oldest; reassign messages), then partial unique index on `request_id`
- `src/app/api/conversations/ensure/route.ts` — on insert unique violation (`23505`), re-select and return the existing id
- Ensure route unit tests for the race path

Preserve: party ids from `service_requests` only; participant auth; no client-supplied motorist/pro ids. Out of scope: merging historical notification deep links that pointed at deleted duplicate conversation ids; item 6 push retry queue.

## Review criteria

| ID | Expectation | Verification |
|----|-------------|--------------|
| `unique-index` | Partial unique index on non-null `request_id` | Inspect migration |
| `dedupe` | Migration keeps oldest conversation per `request_id`, moves messages, deletes dupes | Inspect SQL |
| `race-recovery` | Ensure insert `23505` → re-select → 200 with existing id | Unit test |
| `existing-fast-path` | Existing row still returned without insert | Unit (existing) |

## Boundaries and limitations

Hosted: migration must be applied before the race is fully closed in production. Pre-existing deep links to deleted duplicate conversation UUIDs may 404 until the user re-opens chat via the job (ensure returns the keeper).

## Remaining work

Code: migration + ensure + unit tests done (`vitest` ensure/route.test.ts: 7 passed). Independent review and `reviewedCommit` pending.

External: apply/verify migration `083` on the target Supabase project.

## Closeout

`docs/BACKEND_FIXES_STATUS.md` + paired JSON `remainingWork`.
