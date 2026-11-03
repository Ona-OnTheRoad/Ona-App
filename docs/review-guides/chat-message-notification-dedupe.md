# Chat message notification dedupe review guide

## Goal

Each chat message creates its own in-app notification so recipients get toasts/center rows for subsequent messages in an existing conversation. User approved the per-message `groupKey` plan on 2026-11-01.

## Expected change areas

- `src/app/api/messages/send/route.ts` — `groupKey: msg-{conversationId}-{message.id}`
- `src/app/api/messages/notify/route.ts` — same key shape (unused twin; keep aligned)
- `src/app/api/messages/__tests__/send.test.ts` — assert unique per-message keys

Preserve: `insertNotification` skip-if-key-exists for payout/job-complete keys; chat Realtime on `messages`; closed-job chat gates; toast quiet hours / throttle. No Web Push, typing, or read-membership work in this pass.

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON against the reviewed commit. Separate unit-test evidence from live two-device chat evidence.

## Boundaries and limitations

Does not upsert one row per conversation, subscribe to notification UPDATEs, wire Web Push on send, or remove `/api/messages/notify`. Center may grow one unread row per message until the user opens the thread / marks read.

## Remaining work

Code: send route + notify alignment + unit tests done (`vitest` send.test.ts: 8 passed). Independent human review and `reviewedCommit` recording pending.

External: authenticated two-party live check (send 2+ messages while peer is on another screen; confirm toast/center updates each time) pending.

## Closeout

Record residuals in `docs/BACKEND_FIXES_STATUS.md` and in the paired JSON `remainingWork`.
