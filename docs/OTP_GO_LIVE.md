# Live phone OTP (Africa's Talking): go-live runbook

## How the switch works

Going live is **configuration only**. Deploy the code first; nothing changes until the
Africa's Talking variables are set on the server.

| State | Phone code behaviour |
|---|---|
| `AT_USERNAME` / `AT_API_KEY` **not** set | Unchanged: demo code `336699` is still accepted (so a deploy is safe). |
| Both **set** (production) | A random 6-digit code is sent by SMS. The demo code is **rejected**. |
| Local / `next dev` | Demo code always works. No SMS needed to develop. |

Email OTP is **not** affected: it has no delivery provider yet and keeps the demo code
(see "Not covered yet").

### Environment variables (server)

| Variable | Required | Notes |
|---|---|---|
| `AT_USERNAME` | yes | `sandbox` while testing, your app username in production |
| `AT_API_KEY` | yes | From the Africa's Talking dashboard. Server only, never `NEXT_PUBLIC_*` |
| `AT_SENDER_ID` | recommended | Approved alphanumeric sender (e.g. `ONA`). See below |
| `NEXT_PUBLIC_APP_URL` | recommended | `https://<your-domain>`. Used for Chrome auto-fill (see below) |
| `OTP_PHONE_DEMO_MODE` | optional | `true` / `false` forces the phone demo code on/off, overriding the rule above (emergency rollback: `true`) |

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

1. Deploy this change. Behaviour is unchanged (no AT variables yet).
2. On a preview/staging deployment set the **sandbox** variables, sign in with a registered number,
   confirm the message appears in the simulator and the code verifies.
3. Production: set `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID`, `NEXT_PUBLIC_APP_URL`; redeploy.
4. Smoke test with a real number on each network: login, Tier 1 phone verification, the
   dual-role switch code. Confirm `336699` is now **rejected**.
5. Watch server logs for `otp.sms_failed` (carries the Africa's Talking status, never the code;
   the number is masked) and `otp.sms_unavailable`.

**Rollback:** set `OTP_PHONE_DEMO_MODE=true` (demo code back on) or remove the AT variables. No
redeploy of code is needed beyond picking up the environment.

## What users get

- Real SMS: `Your Ona code is 123456. It expires in 10 minutes. Never share it with anyone.`
  followed by `@<your-domain> #123456`.
- **Auto-fill:** iOS/Android keyboards suggest the code; Chrome on Android fills the boxes by itself
  (WebOTP, needs the last line above and an HTTPS origin). The login screen submits automatically
  when the 6th digit lands.
- A visible "Resend code (24s)" timer. The server enforces the same 30 s gap.
- Honest errors: if the gateway refuses the SMS the user is told, instead of "Code sent".

## Abuse and cost controls (server)

- 30 s minimum between codes to the same number.
- 8 codes / 10 min per IP and number, **10 / day per number**, **30 / hour per IP**.
- A code can only be requested for a number that already has an account (login/verify flows).
- 5 wrong guesses voids the code; only a hash of the code is stored.

## Not covered yet (follow-ups)

These were found while auditing and are **separate pieces of work**; none is made worse by this
change, but they matter before you call OTP "done".

1. **Email OTP is demo-only.** `channel: "email"` never sends anything and always uses `336699`.
   Wire Resend (`src/lib/server/resend.ts`) the same way, then switch email off the legacy rule.
   Affected: email login, forgot password, bank-change identity check (`/api/security/verify-identity`).
2. **Changing to a NEW phone number cannot send a code.** `otp/send` only accepts numbers that already
   have an account, so the step "send code to your new phone" returns *not registered*. Needs a
   `purpose: "change_phone"` mode (authenticated, number must be unused, rate-limited per user).
3. **`/api/profile/update` accepts a new `phone` without any OTP proof.** Require a recently consumed
   OTP for that exact number before applying the change.
4. **`contact_change_requests`** (`security-store.ts`) stores codes in plain text, never delivers
   them and never expires them. Either retire it or route it through `phone_otps`.
5. **Customer Tier 1 verification calls `/api/auth/otp/verify`** (the login route), which mints a new
   session. Use `/api/auth/otp/profile-verify` there.
6. **2FA** in Settings is stored in the browser only and is not enforced at login. The SMS step now
   sends/checks a real code, but the feature is not a real second factor yet.
7. **Admin unlock.** `src/lib/server/modules/sensitive-unlock.ts` signs unlock tokens with a built-in
   fallback secret and the unlock password defaults to `336699` unless the environment overrides them.
   Set `ADMIN_UNLOCK_SIGNING_SECRET` and `ADMIN_SENSITIVE_PASSWORD` in production, then remove the
   fallback.
8. The code hash falls back to the constant `"om"` when `SUPABASE_SERVICE_ROLE_KEY` is missing; use a
   dedicated `OTP_HASH_SECRET`.
9. Add Africa's Talking **delivery reports** (callback URL) if you want to see delivered/failed
   per message instead of relying on the send response.
