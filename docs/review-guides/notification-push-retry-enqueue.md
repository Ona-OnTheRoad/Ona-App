# Notification push retry enqueue review guide

## Goal

Transient Web Push failures are written to `notification_deliveries` so the existing cron can retry them. User approved item 6 on 2026-11-04 (“go”).

## Expected change areas

- `src/lib/server/push/webpush.ts` — honor `noEnqueue`; enqueue when `sent === 0` and failures look retryable
- `src/lib/server/push/__tests__/webpush.test.ts` — enqueue / skip / noEnqueue cases

Preserve: preference gating; 404/410 prune; cron `processDueNotificationRetries` already passes `noEnqueue: true`. Out of scope: SMS/email enqueue, cron activation/hosted secrets, chat/job call-site changes (they already call `sendPushToUser`).

## Retry policy

| Outcome | Enqueue? |
|---------|----------|
| `sent > 0` | No |
| Prefs / VAPID / no subscriptions / only 404·410 | No (non-retryable) |
| Transient / network / 5xx / `push_failed` with `sent === 0` | Yes |
| Called with `{ noEnqueue: true }` (cron) | No |

## Review criteria

| ID | Expectation | Verification |
|----|-------------|--------------|
| `enqueue-transient` | Zero-sent retryable failure calls `enqueueNotificationDelivery` | Unit |
| `skip-permanent` | Prefs / no_subscriptions / vapid do not enqueue | Unit |
| `no-enqueue-flag` | Cron path with `noEnqueue: true` does not enqueue | Unit |
| `hosted-cron` | Cron route processes due rows in target env | External / pending |

## Remaining work

Code: `sendPushToUser` enqueue wiring + unit tests done (`vitest` webpush.test.ts: 9 passed). Independent review and `reviewedCommit` pending.

External: confirm `/api/cron/notification-retry` is scheduled with secret on the target host (may already exist unused).

## Closeout

`docs/BACKEND_FIXES_STATUS.md` + paired JSON.
