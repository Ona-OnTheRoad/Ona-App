# Feature review guide: demo OTP follows its flag

## Goal

`OTP_DEMO_MODE` / `NEXT_PUBLIC_OTP_DEMO_MODE` become the switch for the demo OTP code (`336699`) in every environment, not only in production. Today `isDemoOtpAllowed()` returns `true` whenever `NODE_ENV` is not `production`, so a local `next dev` run with both flags `false` still accepts `336699` and quietly stores it when a real SMS or email fails. That made a real-delivery test impossible locally: an Africa's Talking send failed, the route fell back to the demo code, the screen said "Code sent" and nothing was logged.

Agreed plan (approved in conversation, 2026-11-20):

1. `src/lib/auth/demo-otp.ts`: if either flag is set (non-blank), the flags decide: on when either is `true` / `1`, off otherwise. Only when both are unset or blank does the old rule apply (on outside production, off in production).
2. `src/app/api/auth/otp/send/route.ts`: log every failed real delivery with the channel and the provider's error, also when demo mode is on and the route falls back to the demo code. Never log the phone number, email address or code.
3. Tests for both, and the full suite.
4. Update the demo OTP note in `docs/HANDOFF.md`.

## Expected change areas

- `src/lib/auth/demo-otp.ts` (`isDemoOtpAllowed`; one rule shared by login, signup, profile verify, change-bank, change-contact, verify-identity and artisan onboarding).
- `src/app/api/auth/otp/send/route.ts` (failed-delivery log line).
- `src/lib/auth/__tests__/demo-otp.test.ts`, `src/app/api/auth/otp/send/__tests__/route.test.ts`.
- `docs/HANDOFF.md`, `docs/BACKEND_FIXES_STATUS.md`.

Indirect: `src/lib/server/modules/sensitive-unlock.ts` uses `isDemoOtpAllowed()` for its signing-secret fallback. A dev environment that sets a flag to `false` and has none of `ADMIN_UNLOCK_SIGNING_SECRET`, `ADMIN_FIELD_ENCRYPTION_KEY`, `ADMIN_SENSITIVE_PASSWORD` loses that fallback, as production already does.

No protected file (`docs/RULES.md` §10) is touched. No migration.

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON guide (`demo-otp-flag.json`) against the exact reviewed commit. Record concrete implementation/test evidence and live evidence separately. Never mark an unrun check passed.

## Boundaries and limitations

- Production behaviour is unchanged: both flags unset means off; either flag `true` means on; a flag set to anything else (including `false`) means off unless the other is `true`.
- Changes outside production: a set flag now wins over `NODE_ENV`. Environments that leave both flags unset (tests, most local setups) keep demo mode on.
- The browser bundle only sees `NEXT_PUBLIC_OTP_DEMO_MODE`. With `OTP_DEMO_MODE=false` and `NEXT_PUBLIC_OTP_DEMO_MODE` unset, client helpers in dev still treat demo as allowed while the server rejects it. The server is the authority; set both flags together.
- Out of scope: why the Africa's Talking send failed on 2026-11-20 (provider-side: credit, sender ID, DND or key). The new log line is what will show it.
- Out of scope: the contact-change flow (`security-store.ts`) still issues its own codes without deliver-or-fail (existing follow-up from identity batch 1).

## Remaining work

Code / tests / review:

- Independent review against the implementation commit.

External / hosted:

- Live check on a local `next dev` run with both flags `false`: `336699` rejected, a failed SMS returns 502 and the provider error appears in the server log.
- Confirm the hosted environment's flag values are unchanged by this release (production semantics are the same, so no host change is expected).

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the issue state and the same remaining code and external work. In the paired JSON guide, keep `remainingWork: { "code": [], "external": [] }` current, using explicit verified-none entries when appropriate.
