# Open-search dispatch: broadcast, nearest first, first to accept

Replaces the one-pro-at-a-time offer for **open searches** (the customer did not pick a specific pro).
A job the customer sends to a chosen pro is unchanged.

## How it works

1. The customer posts a request. It sits **unclaimed** (`pairing_stage = sequential_pairing`, `repair_pro_id` null) for a
   144 s window (`BROADCAST_WINDOW_MS`).
2. Pros see it by distance tier (`src/lib/jobs/broadcast-tiers.ts`), measured from when the broadcast started:

   | Time since broadcast | Pros within |
   |---|---|
   | 0 s  | 2 km |
   | 10 s | 5 km |
   | 20 s | 10 km (platform maximum) |

   Visibility is also capped by the customer's chosen radius and the pro's own coverage radius (both max 10 km).
3. A pro must be online, have a heartbeat in the last 5 min, match the trade, and not be suspended.
4. Seeing a card never claims it. The pro's **Accept** ("I can fix this") claims it: `OPEN` runs the atomic
   `claim_broadcast_offer` SQL function (migration 086) and `CONFIRM` follows. First to accept wins; everyone else gets
   "already taken" and the card closes.
5. **Re-opening.** Customer taps *Find another pro* (`REOPEN` transition), the pro backs out, or the pro times out:
   the job returns to the pool, the pro who held it is excluded for that request, the negotiation is cleared, and the tiers
   restart so the nearest pros get the head start again. Nothing is re-opened once the customer has agreed a price / paid.
6. If nobody claims it within the window the request expires and the customer can Retry (unchanged).
   If no pro could ever see it (nobody online in range) it fails fast (4 s) instead of waiting the full window.

## Where things live

| Concern | File |
|---|---|
| Tier maths (pure) | `src/lib/jobs/broadcast-tiers.ts` |
| Visibility, claim, dismiss, push | `src/lib/server/pairing/broadcast.ts` |
| Advance / expire / reopen | `src/lib/server/pairing/pairing-engine.ts` (`advanceBroadcast`, `reopenJobToPool`) |
| Pro feed (open jobs shaped as offers) | `listBroadcastOffersForPro`, merged in `job-store/reads.ts` |
| Atomic claim | `supabase/migrations/20261117_086_claim_broadcast_offer.sql` |
| Customer reject | `REOPEN` in `api/jobs/[id]/transition` + *Find another pro* in the negotiation screen |

## Rollout

* Apply migration **086** before deploying. Until it is applied, claiming fails closed (503): no data is corrupted, pros just
  cannot accept. `scripts/e2e/lifecycle.mjs` section 0 reports a missing function.
* **Rollback switch:** set `PAIRING_DISPATCH_MODE=sequential` and redeploy. The legacy one-pro-at-a-time engine runs again;
  no migration to undo.
* Pros learn about new jobs by **polling every 3 s** while online (open jobs have no assigned pro, so realtime does not push
  them). Push notifications for the 5 km / 10 km tiers are sent by `pairing-sweep`; the customer's open search screen triggers
  it when each tier opens, and a per-minute scheduler on `/api/jobs/pairing-sweep` makes it independent of the customer's app
  (`vercel.json` only schedules it daily).
* Load: each online pro's 3 s list poll now also runs one small pool query. Watch DB CPU after launch.

## Privacy note

Every eligible pro in range now sees the customer's pin and problem text before accepting (previously only the one offered pro
did). The pro list does not include the customer's phone number or full contact details; these are revealed on claim as before.
