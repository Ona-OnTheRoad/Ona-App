# Readable wait and countdown times

## Goal

Every wait or countdown shown to users reads naturally. Under a minute it stays in seconds; from a minute up it shows minutes (and hours). The user requested this on 2026-11-23 as a side fix after `liveness-status-reload`.

- Wait messages ("Try again in …", "Please wait … before …") use `formatWait`: "25 seconds", "about 26 minutes", "about 1 hour 30 minutes". It rounds up, so no one comes back early.
- Live countdowns and durations use `formatClock`: "45s", "1m 06s", "1h 02m".

Follow-up (user approved, same day): the two long waits shown on screen now count down live.

- **Liveness lock card:** "Too many attempts. Try again in 25m 02s" ticks every second (`use-lock-countdown.ts`). When the wait ends, it shows "You can try again now." with a Try again button.
- **Server attempt limit (429):** the client reads `Retry-After` (`submit-selfie.ts`) and shows the same live lock card instead of a fixed message.

Other server wait messages (login, OTP, payments and so on) stay fixed text from when the request was refused. They round up, so users never come back too early.

## Expected change areas

- `src/lib/format-wait.ts`: `formatWait` and `formatClock`.
- Rate-limit and cooldown messages in 17 routes or modules (auth login, signup, OTP send/verify, verify-password; security change-bank, change-contact, verify-identity; payments verify and resolve-account; admin unlock and sensitive auth; NIN/BVN lookup guard; artisan verification; sign-in form). "Retry in Ns" now reads "Try again in …".
- Countdowns and durations: Tier 1 resend, post-switch OTP gate, signup verify, sign-in code step (`formatCountdown` now delegates to `formatClock`), voice note recorder, error page redirect, intro video length message, liveness lockout (`formatRemaining`).
- `src/components/profile/face-liveness/use-lock-countdown.ts` (new), `use-face-liveness.ts`, `submit-selfie.ts`: live lock countdown and server Retry-After.
- Tests: `format-wait.test.ts`, `__tests__/use-lock-countdown.test.ts`, `__tests__/submit-selfie.test.ts`, and updated OTP and sign-in assertions.
- `use-sign-in-form.ts` reads the wait in seconds or minutes from the server message.
- No `docs/RULES.md` §10 file is touched.

## Boundaries and limitations

- `src/components/jobs/countdown-timer.tsx` is unchanged. It deliberately shows short pairing windows of 99 s or less as raw seconds ("66s"), per an earlier product decision. It is flagged for the product owner.
- `Retry-After` headers stay in seconds, as the standard expects.

## Remaining work

- **Code:** independent review; a product decision on the job pairing timer.
- **External:** spot-check a few messages in the browser on dev.

## Closeout

Not closed.
