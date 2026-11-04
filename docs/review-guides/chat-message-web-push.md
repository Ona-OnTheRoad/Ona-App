# Chat message Web Push review guide

## Goal

Recipients get an OS Web Push for every chat message (background / closed app), with one tray item per conversation. High-priority chat is always attempted for push (no quiet-hours suppression). User approved 2026-11-04: always push, one tray item, high priority through quiet hours.

## Expected change areas

- `src/app/api/messages/send/route.ts` — best-effort `sendPushToUser` after in-app notify
- `src/app/api/messages/notify/route.ts` — same payload shape (unused twin; keep aligned)
- `src/app/api/messages/__tests__/send.test.ts` — assert push call / send still succeeds if push fails

Preserve: per-message in-app `groupKey`, preference gating inside `sendPushToUser`, message insert success when push fails. Out of scope: presence-aware skip, quiet-hours logic inside webpush, retry enqueue, unify-all-producers helper.

## Product rules

| Rule | Implementation |
|------|----------------|
| Always push | Call `sendPushToUser` on every successful notify path (no “peer active” check) |
| One tray item | `tag: msg-{conversationId}` so OS collapses to latest preview |
| High through quiet hours | `priority: "high"`; push path does not apply quiet hours (toasts already break through for high) |
| Prefs | Still gated by master / push / `categories.messages` inside `sendPushToUser` (not critical breakthrough) |

## Reviewer procedure

Paired JSON criteria; unit evidence vs hosted VAPID + two-device smoke stay separate.

## Boundaries and limitations

No subscription / VAPID → `sent: 0`; that is env/user permission, not a send-route bug. Does not change job cancel/expire push producers.

## Remaining work

Code: send + notify push wiring + unit tests done (`vitest` send.test.ts: 9 passed). Independent review and `reviewedCommit` pending.

External: VAPID configured on target host; two-device background push smoke.

## Closeout

`docs/BACKEND_FIXES_STATUS.md` + JSON `remainingWork`.
