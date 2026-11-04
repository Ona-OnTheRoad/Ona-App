# Messages read membership review guide

## Goal

`POST /api/messages/read` must only mark messages read when the authenticated user is a participant in the conversation (same boundary as send). User approved 2026-11-04.

## Expected change areas

- `src/app/api/messages/read/route.ts` — load conversation; require motorist/pro membership; then update
- `src/app/api/messages/__tests__/read.test.ts` — participant ok; non-participant 403; missing conversation 404; userId mismatch 403

Preserve: service-role update of peer `read_at`; client `backendMarkMessagesRead` body shape (`conversationId` + `userId`); send/ensure membership patterns. Out of scope: dropping body `userId`, typing/push/dedupe, conversation uniqueness.

## Review criteria

| ID | Expectation | Verification |
|----|-------------|--------------|
| `membership-check` | Caller must be `motorist_id` or `repair_pro_id` | Unit + code inspect |
| `missing-conversation` | Unknown id → 404 | Unit |
| `userId-session` | Body `userId` must match session (unchanged) | Unit |
| `participant-success` | Participant marks peer unread messages | Unit |

## Boundaries and limitations

Does not prove a leaked UUID cannot be discovered; only that non-members cannot mutate `read_at`. No migration.

## Remaining work

Code: membership check + unit tests done (`vitest` read.test.ts: 4 passed). Independent review and `reviewedCommit` pending.

External: verified none beyond deploying the API route.

## Closeout

`docs/BACKEND_FIXES_STATUS.md` + paired JSON `remainingWork`.
