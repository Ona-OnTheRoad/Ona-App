# Liveness cooldown reduction

## Goal

User requested reducing the six-failure liveness cooldown from 30 minutes to one minute on 2026-10-18.

## Implementation plan and criteria

Keep the six-failure threshold, change duration to 60 seconds, and normalize stored legacy locks that exceed the new duration using their original 30-minute duration. Locks already within one minute expire within that minute. Verify sixth-failure locking, expiry, per-user isolation and legacy records. No liveness detection, approval or backend changes.

## Expected change areas

`src/lib/liveness/lockout.ts`, focused lockout tests and this paired guide. Protected fee/job timers excluded. Separate local polling pauses remain uncommitted.

## Reviewer procedure

Check paired requirements against the diff; run deterministic clock/storage checks. Separate automated results from camera/browser checks. Unrun checks stay pending.

## Boundaries and limitations

Browser-local cooldown, not a server rate limit. An already open liveness dialog may need closing and reopening to read its saved lock again. No database mutation or verification bypass.

## Remaining work

Code: implementation complete; 6 focused tests, typecheck, targeted lint and diff check passed. Independent review pending; full suite subsequently passed (see PR validation).
External: camera/browser smoke pending; deployment not performed.

## Closeout

Uncommitted; independent review pending. Separate from numbered backend report fixes; no report closure claimed.

## PR validation

Full isolated branch suite: 1,461 tests / 136 files passed; typecheck, lint (zero errors) and diff check passed. Independent human review remains pending; browser/hosted checks remain as listed above.
