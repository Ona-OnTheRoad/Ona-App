# Live phone OTP (Africa's Talking): go-live runbook

## How the switch works

Real delivery is **configuration only**, and the demo code is **opt-in** (see `src/lib/auth/demo-otp.ts`
and `src/lib/server/auth/otp-delivery.ts`). The same rule applies to phone and email.

| State | Code behaviour |
|---|---|
| Provider configured (`AT_*` / `TERMII_*` for SMS, `RESEND_API_KEY` for email) | A random 6-digit code is sent. |
| No provider, `OTP_DEMO_MODE` / `NEXT_PUBLIC_OTP_DEMO_MODE` exactly `true` | Demo code `336699` is stored and accepted (staging only). |
| No provider, demo flags unset | The send fails with 503 `otp_delivery_unavailable`. No code is issued. |
| Provider configured but a send fails, demo off | 502 `otp_delivery_failed`. Nothing is stored, so the user's current code is not rotated. |
| Local / `next dev` | Demo code always works. |

**Production must not set the demo flags** once real delivery is on: while either is `true` the demo
code is accepted for any account. Remove both (or set them to `false`) at go-live.

### Environment variables (server)

| Variable | Required | Notes |
|---|---|---|
| `AT_USERNAME` | yes | `sandbox` while testing, your app username in production |
| `AT_API_KEY` | yes | From the Africa's Talking dashboard. Server only, never `NEXT_PUBLIC_*` |
| `AT_SENDER_ID` | recommended | Approved alphanumeric sender (e.g. `ONA`). See below |
| `NEXT_PUBLIC_APP_URL` | recommended | `https://<your-domain>`. Used for Chrome auto-fill (see below) |
| `OTP_DEMO_MODE` / `NEXT_PUBLIC_OTP_DEMO_MODE` | avoid in production | Exactly `true` turns the demo code on. Leave unset in production |
| `OTP_PROOF_SECRET` | optional | Signs the signup phone proof. Falls back to `SUPABASE_SERVICE_ROLE_KEY`; set a dedicated value to rotate it independently |
| `OTP_SIGNUP_DAILY_BUDGET` | optional | Max signup SMS per day across the whole app (default 3000). Circuit breaker against SMS pumping |

## Africa's Talking account checklist

1. **Sandbox first.** Username `sandbox` posts to the sandbox host automatically. The sandbox does
   not text real phones; messages show in the dashboard simulator. Use it to check the flow.
2. **Production app.** Create the production app, copy its username and API key.
3. **Credit.** Top up airtime/balance. A balance of zero returns `InsufficientBalance` and users
   see "We couldn't send the SMS right now".
4. **Sender ID (Nigeria).** Register an alphanumeric sender ID with Africa's Talking (NCC rules
   apply) and set `AT_SENDER_ID` once approved. Unregistered senders can be filtered, and numbers on
   DND are often blocked on the promotional route, so confirm the account sends on the
   **transactional / OTP** route for Nigerian networks (MTN, Airtel, Glo, 9mobile) before launch.
5. **Test numbers on every network** you care about before announcing.

## Rollout

1. Deploy this change. With no provider and no demo flag, code requests fail with 503 until a provider is set.
2. On a preview/staging deployment set the **sandbox** variables, sign in with a registered number,
   confirm the message appears in the simulator and the code verifies.
3. Production: set `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID`, `NEXT_PUBLIC_APP_URL`, and **remove `OTP_DEMO_MODE` / `NEXT_PUBLIC_OTP_DEMO_MODE`**; redeploy.
4. Smoke test with a real number on each network: login, Tier 1 phone verification, the
   dual-role switch code. Confirm `336699` is now **rejected**.
5. Watch server logs for `[otp/send] phone delivery failed` and `otp.signup.sms_failed` (the cause, never the code).

**Rollback:** fix or restore the provider variables. Turning the demo flags back on re-opens the demo code for every account, so only do that on a non-production environment.

## What users get

- Real SMS: `Your Ona code is 123456. It expires in 10 minutes. Never share it with anyone.`
  followed by `@<your-domain> #123456`.
- **Auto-fill:** iOS/Android keyboards suggest the code; Chrome on Android fills the boxes by itself
  (WebOTP, needs the last line above and an HTTPS origin). The login screen submits automatically
  when the 6th digit lands.
- A visible "Resend code (24s)" timer. The server enforces the same 30 s gap.
- Honest errors: if the gateway refuses the SMS the user is told, instead of "Code sent".

## Signup "Verify your number" (before the account exists)

The signup screen texts a code to the number from the details step, then checks it. Always
skippable ("Skip for now"); a skipped phone is verified later from the profile as before.

- `POST /api/auth/otp/signup/send`: texts a code to a number that has **no** account.
  A number that already has one gets `phone_in_use` (the screen offers *Log in* / *Use a different number*).
- `POST /api/auth/otp/signup/verify`: checks the code. On success it returns a signed **proof**
  (HMAC, **2 hours** so it outlasts the Repair Pro wizard, bound to that exact number). It never
  creates a session or an account.
- The proof lives in the signup draft (session storage). `POST /api/auth/signup` accepts it and marks
  the phone verified **only** if it is valid and matches the submitted number. A missing, expired,
  tampered or other-number proof is ignored: the account is simply created unverified. It can never
  block signup.
- **Production never uses the demo code here**, even with the demo flags on: a "verified" phone
  must come from a real SMS. Until Africa's Talking is configured the screen honestly says
  "Phone verification isn't available right now" and the user skips, exactly as before go-live. The demo
  code works only in local development.
- Signup codes are stored under `signup:<phone>`, a separate namespace from login codes, so a signup
  code can never sign anyone in and a login code can never mint a proof.
- Changing the number after verifying drops the proof, so the new number is verified again.
- Controls: 30 s between codes, 5 codes / number / day, 20 / hour / IP (generous: mobile carriers put
  many users behind one IP), a global daily budget, and 5 wrong guesses voids a code.
- If SMS fails or the budget is hit the screen says so and offers *Try again* and *Skip for now*.

## Abuse and cost controls (server)

- 30 s minimum between codes to the same number.
- 8 codes / 10 min per IP and number, **10 / day per number**, **30 / hour per IP**.
- A code can only be requested for a number that already has an account (login/verify flows).
- 5 wrong guesses voids the code; only a hash of the code is stored.

## Not covered yet (follow-ups)

These were found while auditing and are **separate pieces of work**; none is made worse by this
change, but they matter before you call OTP "done". (Signup phone verification, previously item 2's
sibling, is now built: see above.)

1. ~~**Email OTP is demo-only.**~~ Login/verify email codes are now delivered by Resend when
   `RESEND_API_KEY` is set. Still demo-only: the bank-change identity check
   (`/api/security/verify-identity`) and `contact_change_requests` (item 4), which never deliver a code.
2. ~~**Changing to a NEW phone number or email cannot send a code.**~~ Fixed. Settings now uses
   `POST /api/security/change-contact/send-code` (authenticated, needs a fresh identity proof, target must not
   belong to another account, delivered through the same SMS/email layer, stored hashed, 10 min, 5 attempts,
   30 s resend, 5 codes/user/day). The demo code never authorises a contact change in production.
3. ~~**`/api/profile/update` and `/api/security/action` accepted a new phone/email without any proof.**~~ Fixed.
   `change_phone` / `change_email` now require an identity proof (issued by `/api/security/verify-identity`,
   10 min, bound to the user) **and** the code sent to that exact new contact. Duplicates use the same
   last-10-digits rule as signup and fail closed. A changed phone is marked verified. `/api/profile/update`
   no longer writes a phone that differs from the stored one (it only fills in a missing phone).
   Also fixed: `verify-identity` demanded a guarantor from users who have none (every customer), had no
   attempt limit, and is now rate limited per user.
4. ~~**`contact_change_requests`** stored codes in plain text and `/api/security/contact-change` was
   unauthenticated.~~ Locked down: sign-in required, own requests only, codes redacted from every response
   (including the admin API). Nothing in the app creates these requests (Settings uses the flow above),
   so the table and its admin tab are effectively legacy: consider retiring them.
5. **Customer Tier 1 verification calls `/api/auth/otp/verify`** (the login route), which mints a new
   session. Use `/api/auth/otp/profile-verify` there.
6. **2FA** in Settings is stored in the browser only and is not enforced at login. The SMS step now
   sends/checks a real code, but the feature is not a real second factor yet.
7. ~~**Admin unlock** used a built-in fallback signing secret.~~ Removed: in production the unlock token
   now requires `ADMIN_UNLOCK_SIGNING_SECRET`, `ADMIN_FIELD_ENCRYPTION_KEY` or `ADMIN_SENSITIVE_PASSWORD`
   and throws otherwise. Make sure at least one is set on the host.
8. The code hash falls back to the constant `"om"` when `SUPABASE_SERVICE_ROLE_KEY` is missing; use a
   dedicated `OTP_HASH_SECRET`.
9. Add Africa's Talking **delivery reports** (callback URL) if you want to see delivered/failed
   per message instead of relying on the send response.
10. **Bot protection on the signup send endpoint.** The caps and daily budget limit the damage, but a
    CAPTCHA (e.g. Cloudflare Turnstile) in front of `/api/auth/otp/signup/send` would stop automated
    abuse earlier.
11. **Number squatting.** An account can still be created with someone else's number *unverified*, which
    then blocks them from signing up (`phone_exists`). Now that verified signups exist, a verified signup
    could be allowed to reclaim a number held by an unverified account.
12. ~~The duplicate-phone check in `/api/auth/signup` only scanned the first 500 profiles.~~ Fixed: it now
    searches every profile in the database (`findPhoneOwners` in `src/lib/server/otp/phone-owners.ts`,
    same last-10-digits rule as before, so `0803…`, `234803…` and `0803 123 4567` all collide) and fails
    closed with a retryable error if the lookup itself fails. Signup and the signup-OTP endpoints now use
    the same lookup, so a number that passes verification is never rejected as a duplicate afterwards.

### Bank account change (payout / refund destination)

Changing a SAVED bank account now needs a code sent to the phone on the account:

1. `POST /api/security/change-bank/send-code`: the server reads the phone from the account (the browser
   cannot choose it), delivers through the same SMS layer, stores the code hashed in the `bank:` namespace
   (10 min, 5 attempts, 30 s resend, 5 codes/user/day). The demo code never works here in production.
2. `POST /api/security/change-bank/verify-code`: checks the code, returns a 10-minute `bankProof`.
3. `POST /api/security/action` (`change_bank`) requires the proof, validates 10 digits, rejects an account
   another user has, and reports a failed write as an error.
4. `POST /api/profile/update` no longer lets the generic save point payouts at a DIFFERENT account
   (403 `bank_change_requires_verification`, before any write). First-time setup and the unchanged bank the
   app resends on every save still pass; either role row counts as "on file".

Operational: SMS must be configured for bank changes to work. With no provider the screens say
"Verification is not available right now" and the bank is left unchanged.
