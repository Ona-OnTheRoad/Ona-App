# Feature review guide: demo OTP follows its flag, with a dev fallback

## Goal

`OTP_DEMO_MODE` / `NEXT_PUBLIC_OTP_DEMO_MODE` are the switch for the demo OTP code (`336699`) in every environment, and local development keeps working when real delivery fails.

Before: `isDemoOtpAllowed()` returned `true` whenever `NODE_ENV` was not `production`, so a local `next dev` run with both flags `false` still accepted `336699` and quietly stored it when a real SMS or email failed. An Africa's Talking send failed, the route fell back to the demo code, the screen said "Code sent" and nothing was logged.

Vercel runs every deployment (including previews and the environment the team treats as development) with `NODE_ENV=production`, so the flag, not `NODE_ENV`, is what a hosted staging environment can use to keep the demo code.

| Environment | Real send succeeds | Real send fails, or no provider |
| --- | --- | --- |
| Not production, flag `false` | Real code only; `336699` rejected | `336699` stored and accepted (dev fallback), failure logged |
| Not production, flag `true` or both unset | `336699` also accepted | `336699` stored |
| Production, flag `true` | `336699` also accepted | `336699` stored (login only; see below) |
| Production, flags `false` or unset | Real code only | 502 (send failed) / 503 (no provider) |

Signup, change-bank and change-contact keep their existing guard that the demo code is development-only: in production they never store or accept `336699`, whatever the flag. They get the same dev fallback as login.

Agreed plan (approved in conversation, 2026-11-20; scope extended 2026-11-21):

1. `src/lib/auth/demo-otp.ts`: if either flag is set (non-blank), the flags decide whether `336699` is accepted: on when either is `true` / `1`, off otherwise. Only when both are unset or blank does `NODE_ENV` decide (on outside production, off in production).
2. `src/app/api/auth/otp/send/route.ts`: log every failed real delivery with the channel and the provider's error, also when the route falls back to the demo code. Never log the phone number, email address or code.
3. (2026-11-21) `isDemoFallbackAllowed()` in `demo-otp.ts`: may a failed or impossible send store `336699`? Always outside production; in production only when the flag allows demo, and never for the dev-only routes. Used by login send, `planOtpDelivery`, signup send, change-bank send-code and change-contact send-code.
4. (2026-11-21) `backendSendOtp` in `src/lib/supabase/app-api.ts`: drop the client's idempotency sticker when the server gives a definite send failure, or when the ledger reports a lost send as failed. Before, the sticker was kept, so every later tap replayed the stored error (502) without running the send: one failed send locked that number out until local storage was cleared. A lost response with no conclusive answer still keeps the sticker, so a retry cannot send twice.
5. Tests for all of the above, and the full suite.
6. Update the demo OTP notes in `docs/HANDOFF.md` and `docs/OTP_GO_LIVE.md`.

## Expected change areas

- `src/lib/auth/demo-otp.ts` (`isDemoOtpAllowed`, `isDemoFallbackAllowed`; acceptance rule shared by login, profile verify, verify-identity, the contact-change store, artisan onboarding and the browser sign-in helper).
- `src/lib/server/auth/otp-delivery.ts` (`planOtpDelivery`: no provider means demo when the fallback is allowed).
- `src/app/api/auth/otp/send/route.ts`, `src/app/api/auth/otp/signup/send/route.ts`, `src/app/api/security/change-bank/send-code/route.ts`, `src/app/api/security/change-contact/send-code/route.ts`.
- `src/lib/supabase/app-api.ts` (`backendSendOtp`, `settleSend`).
- Tests next to each of those, `src/lib/auth/__tests__/demo-otp.test.ts` and `src/lib/supabase/__tests__/backend-send-otp.test.ts`.
- `docs/HANDOFF.md`, `docs/OTP_GO_LIVE.md`, `docs/BACKEND_FIXES_STATUS.md`.

`src/lib/server/modules/sensitive-unlock.ts` does not use the demo rule (its dev signing secret depends on `NODE_ENV` only); unaffected.

No protected file (`docs/RULES.md` §10) is touched. No migration.

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON guide (`demo-otp-flag.json`) against the exact reviewed commit. Record concrete implementation/test evidence and live evidence separately. Never mark an unrun check passed.

## Boundaries and limitations

- Production results are unchanged from before this branch for every flag value.
- A dev fallback stores `336699` as the real code for that send, so it verifies through the normal stored-code check; with the flag `false` it is not accepted for a send that did go out.
- The fallback response still says "Code sent"; the demo code is never shown in the client message. The server log line `[otp/send] … (demo code stored instead)` is how a developer sees that delivery failed.
- The browser bundle only sees `NEXT_PUBLIC_OTP_DEMO_MODE`. Set both flags together.
- Failed sends stay recorded as `error` in `idempotent_ops`; only the client stops reusing their key. A browser still holding a sticker from before this change replays its old error once, then gets a fresh key on the next tap.
- Out of scope: why the Africa's Talking send failed (HTTP 401 on 2026-11-20: the key and username in the local env are rejected by both the live and sandbox APIs).
- Out of scope: the contact-change memory store (`security-store.ts`) still issues its own codes without deliver-or-fail (existing follow-up from identity batch 1).

## Remaining work

Code / tests / review:

- Independent review against the implementation commit.

External / hosted:

- Live check on a local `next dev` run with both flags `false`: with the current rejected Africa's Talking key, login send falls back and `336699` logs in; with a working key, `336699` is rejected and the real code works.
- Confirm hosted flag values: staging that needs the demo code keeps `OTP_DEMO_MODE=true` and `NEXT_PUBLIC_OTP_DEMO_MODE=true`; live production leaves both unset.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the issue state and the same remaining code and external work. In the paired JSON guide, keep `remainingWork: { "code": [], "external": [] }` current, using explicit verified-none entries when appropriate.
