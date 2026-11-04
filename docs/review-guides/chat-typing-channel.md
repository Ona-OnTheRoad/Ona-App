# Chat typing channel review guide

## Goal

Peers on the same job conversation share one Supabase broadcast topic so typing indicators work. User approved the stable `om-typing:{conversationId}` plan on 2026-11-04.

## Expected change areas

- `src/components/messages/use-typing-channel.ts` — remove random suffix from channel name
- `src/components/messages/__tests__/use-typing-channel.test.tsx` — assert stable topic

Preserve: `broadcast: { self: false }`, `userId` filter, throttle, closed-chat / local `chat-*` guards, composer wiring. No Web Push, notify dedupe, or read-membership work.

## Reviewer procedure

Inspect each criterion in the paired JSON against the reviewed commit. Unit evidence and two-browser live smoke stay separate.

## Boundaries and limitations

Does not add presence, delivery receipts, or server-side typing persistence. Relies on Supabase Realtime broadcast being available to both authenticated clients.

## Remaining work

Code: stable topic + unit tests done (`vitest` use-typing-channel.test.tsx: 2 passed). Independent human review and `reviewedCommit` recording pending.

External: two-browser live typing smoke on a live job chat pending.

## Closeout

Record residuals in `docs/BACKEND_FIXES_STATUS.md` and paired JSON `remainingWork`.
