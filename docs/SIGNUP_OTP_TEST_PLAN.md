# Signup and OTP: test plan

Scope: everything touched by the merge of `dev` with `feat/live-phone-otp-signup-verification` and the
security hardening branch. Covers signup (customer and Repair Pro), "Verify your number", login by
code, SMS/email delivery, demo-code policy, and the routes and headers changed alongside.

How to use it:

1. **Part A** is automated and already green. Re-run it on every change.
2. **Part B** needs a deployed preview with real providers. Nothing in Part A can send an SMS, open a
   real phone keyboard, or hit the real database, so Part B is what proves go-live.
3. Record the result of every Part B case in the sign-off table (Part F).

---

## A. Automated coverage (run first)

```bash
npm ci && npx tsc --noEmit && npm run lint && npm test && npm run build
npx vitest run src/app/api/auth/__tests__/signup-journey.test.ts   # the end-to-end journeys
```

Last run on the merged branch: typecheck clean, **2,322 tests passing**, 0 lint errors, build passes,
0 production vulnerabilities.

| Layer | File | What it proves |
|---|---|---|
| Journey (real handlers, one shared DB) | `src/app/api/auth/__tests__/signup-journey.test.ts` (42 cases) | send -> verify -> proof -> signup -> login across routes: happy paths for both roles, number formats, skipped verification, wrong/expired/reused/locked codes, resend cooldown, proof tampering/expiry/other-number/rotated-secret/replay, duplicate numbers at all three stages, provider failure and retry, budget and rate limits, validation, resilience |
| Signup route | `src/app/api/auth/signup/__tests__/route.test.ts` | account creation, dual-role attach, NIN/BVN server lookup, phone proof, duplicate-phone scan beyond 500 rows, fail-closed lookup |
| Signup OTP routes | `src/app/api/auth/otp/signup/__tests__/signup-otp.test.ts` | send/verify, caps, budget, demo never mints a proof in production |
| Login OTP route | `src/app/api/auth/otp/__tests__/send.test.ts`, `.../send/__tests__/route.test.ts` | real delivery, demo policy, cooldown, caps, WebOTP origin, 502/503 mapping |
| Delivery layer | `src/lib/server/sms/__tests__/send.test.ts` | provider failover |
| Policy | `src/lib/auth/__tests__/demo-otp.test.ts` | demo code is opt-in in production |
| Proof | `src/lib/server/otp/__tests__/phone-proof.test.ts` | HMAC proof: binding, expiry, tamper |
| Client | `signup-verify.test.tsx`, `signup-draft.test.ts`, `use-pro-signup-submit.test.ts`, `signup-proof-request.test.ts` | the verify screen, draft storage (never the password), proof sent in the request |
| Security changes | `sensitive-unlock-secret.test.ts`, `public-route-limits.test.ts`, `ip-rate-limit.test.ts`, `structured-logger.test.ts` (proxy) | admin unlock secret, geocode/log-error limits, request-id proxy |

**Mutation check done:** breaking proof verification, the production demo guard, the signup duplicate
check, and the wrong-attempt lock each made the journey suite fail (4, 1, 2 and 1 failures). So these
tests do detect the regressions they claim to.

Not covered by automation, and why:

| Gap | Covered in |
|---|---|
| Real SMS/email delivery, sender ID, DND, per-network behaviour | B3, B4 |
| Chrome WebOTP auto-fill, iOS/Android keyboard suggestion | B5 |
| Real Supabase (RLS, migrations, `phone_verified` columns, constraints) | B8 |
| Upstash Redis behaviour (counters, outage) | B7 |
| CSP violations on real pages | B9 |
| Accessibility with a screen reader | B6 |

---

## B. Manual test plan (preview deployment)

### B0. Preconditions

- A **preview** environment, never production, connected to a **non-production Supabase** project.
- Upstash Redis set for that environment (without it, OTP and ID routes return 503 by design).
- `OTP_PROOF_SECRET` set (or `SUPABASE_SERVICE_ROLE_KEY` present).
- Test phones on **MTN, Airtel, Glo and 9mobile**, plus one on DND. Test mailboxes on Gmail and one other provider.
- Delete test accounts afterwards (admin Users page, or `scripts/wipe-user-data.mjs` on the non-production DB).

Run the whole of B1-B3 in each of these environment states. Changing state means changing host
variables and redeploying.

| State | `AT_*` / `TERMII_*` | `RESEND_API_KEY` | `OTP_DEMO_MODE` / `NEXT_PUBLIC_OTP_DEMO_MODE` | Expected |
|---|---|---|---|---|
| S1 production-like | set | set | **unset** | Real codes only. `336699` rejected everywhere |
| S2 staging demo | unset | unset | `true` | Login/verify accept `336699`. Signup-time verification says "isn't available" |
| S3 locked | unset | unset | **unset** | Code requests fail with 503. Signup still works unverified |
| S4 one provider down | set but wrong key | set | unset | 502 "could not send", nothing stored. Retry after fixing works |

**S1 is the state production must be in. A failure of any S1 case is a launch blocker.**

### B1. Signup with phone verification (S1)

| # | Steps | Expected |
|---|---|---|
| 1 | `/signup` -> enter details (name, email, phone, DOB, gender, password) -> continue | Lands on "Verify your number". One SMS arrives within ~30 s. Only one SMS even if the page is reloaded |
| 2 | Read the SMS | Looks like `Your Ona code is 123456 ...` with a final line `@<your-domain> #123456` |
| 3 | Enter the 6 digits | Verifies automatically on the 6th digit. "Continue" appears |
| 4 | Continue -> choose Customer -> finish | Account created, signed in. In the DB `profiles.phone_verified = true` and the role table row too |
| 5 | Repeat as Repair Pro including guarantor and documents (a long wizard) | Same result. Proof survives the whole wizard (valid 2 h) |
| 6 | Log out, log in with the phone and a login code | Works. Typing the number as `0801...`, `+234 801...`, `234801...` all find the account |
| 7 | Log in with email + password | Works, unaffected |

### B2. Signup with phone verification skipped (S1)

| # | Steps | Expected |
|---|---|---|
| 1 | At "Verify your number" tap **Skip for now** | Goes to role selection. Account is created |
| 2 | Check the profile | `phone_verified` is false/null. User is prompted to verify later (profile / Tier 1) |
| 3 | Verify later from the profile | Works and sets verified |

### B3. Code handling and abuse (S1)

| # | Steps | Expected |
|---|---|---|
| 1 | Enter a wrong code | "Incorrect code", boxes clear, nothing stored in the draft |
| 2 | Enter 5 wrong codes | Locked. The genuine code is now refused. "Resend" gives a fresh code that works |
| 3 | Tap Resend before the timer ends | Blocked with the wait message. Timer matches the server (30 s) |
| 4 | Wait past 10 minutes, enter the code | "Code expired" |
| 5 | Use an old code after resending | Refused |
| 6 | Go back, change the phone number, return | New code is requested. The old proof is dropped |
| 7 | Type `336699` | **Rejected** (401/400). This must hold in S1 |
| 8 | Use a number that already has an account | "This number already has an Ona account", with Log in / Use a different number. Skip is removed |
| 9 | Request codes for one number 6 times in a day | 6th is refused (daily cap 5). Not charged |
| 10 | Request codes from one IP repeatedly | Capped at 20/hour |

### B4. Delivery and providers

| # | Scenario | Expected |
|---|---|---|
| 1 | SMS on each network (MTN, Airtel, Glo, 9mobile, one DND number) | Arrives, on the transactional route, with a sensible sender. Record latency per network |
| 2 | Primary SMS provider rejects (wrong key) while the second is configured | Message still arrives via the fallback. Server log shows the failover |
| 3 | Both providers failing (S4) | User sees "We couldn't send the SMS...", with Try again and Skip. No code stored |
| 4 | Zero Africa's Talking balance | Same as above. Ops sees the cause in logs, never the code, number masked |
| 5 | Email login code (S1) | Email arrives, code works, `336699` rejected |
| 6 | Email in S2 | Demo code accepted (staging only) |
| 7 | Daily SMS budget (`OTP_SIGNUP_DAILY_BUDGET=2` on staging) | 3rd signup code returns "busy" and the user can skip. Signup still works |

### B5. Devices and auto-fill

| # | Device / browser | Expected |
|---|---|---|
| 1 | Chrome on Android | Code auto-fills via WebOTP, form submits itself |
| 2 | Safari on iPhone | Keyboard suggests the code above the keypad |
| 3 | Chrome and Safari on desktop | Manual entry works. Paste of 6 digits fills all boxes |
| 4 | Installed PWA (both OSes) | Same as above. Service worker does not cache the signup pages with codes |
| 5 | Slow 3G throttle, and offline mid-flow | Clear error, no duplicate SMS, no stuck spinner. Recovers when back online |
| 6 | Browser back/forward and refresh at each step | No lost state, no second SMS inside the code's lifetime |
| 7 | Two tabs signing up at once | No cross-contamination of draft or proof |

### B6. Accessibility of the signup flow

| # | Check | Expected |
|---|---|---|
| 1 | Complete signup with the keyboard only | Every control reachable, visible focus ring on each (known risk: `outline-none` on custom controls) |
| 2 | VoiceOver (iOS) and TalkBack (Android) | Code boxes announced as a group with a label, errors announced, timer not announcing every second |
| 3 | 200% zoom and large system text | No clipped controls inside the phone-frame shell |
| 4 | Reduced motion enabled | No distracting animation |
| 5 | Contrast of error and helper text | Meets AA |

### B7. Rate limiting and Redis

| # | Scenario | Expected |
|---|---|---|
| 1 | Hit `/api/verify/nin` more than 20 times in 10 minutes from one IP | 429 with `Retry-After` |
| 2 | Hit `/api/geocode` more than 120 times a minute | 429, search recovers after the window |
| 3 | Point Redis at a bad URL (staging) | OTP send and NIN/BVN: 503 "Security checks unavailable". `geocode`, `reverse-geocode`, `log-error`: keep working |
| 4 | Several users behind one carrier IP sign up together | Not blocked at normal volume (limits are deliberately generous) |

### B8. Data and security checks (non-production DB)

Run after B1-B2.

```sql
-- Verified vs skipped signups
select id, phone, phone_verified, phone_verified_at from profiles order by created_at desc limit 10;
-- A signup proof must never leave a session: no row for signup:<phone> should be reusable
select phone, consumed_at, attempts, expires_at from phone_otps where phone like 'signup:%' order by created_at desc limit 10;
-- Duplicate phones (last 10 digits) must not exist
select right(regexp_replace(phone,'\D','','g'),10) as tail, count(*) from profiles
where phone is not null group by 1 having count(*) > 1;
-- Codes are hashed, never plain text
select code_hash from phone_otps limit 3;
```

| # | Check | Expected |
|---|---|---|
| 1 | Duplicate-phone query | Returns no rows |
| 2 | `phone_otps.code_hash` | 64-char hex, never a 6-digit code |
| 3 | Sign up with a proof issued for another number (craft via the API) | Account created, **unverified** |
| 4 | Reuse the same proof for a second signup | 409 `phone_exists`, no second account |
| 5 | Tampered or expired proof | Account created, unverified, no error shown |
| 6 | A login code used on the signup verify endpoint and vice versa | Rejected (separate namespaces) |
| 7 | Server logs during all the above | No raw code, no full phone number, no password |

### B9. Headers, proxy and dependencies

| # | Check | Expected |
|---|---|---|
| 1 | `curl -I https://<preview>/login` | `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`, **`Content-Security-Policy-Report-Only`** present |
| 2 | Open DevTools console on login, signup, map/address search, a payment checkout, face-liveness, chat | **Record every CSP violation.** Add legitimate origins to `next.config.ts`, then switch the header to enforcing only when the console is clean on all of them |
| 3 | `x-request-id` | A supplied valid id is echoed. An invalid or oversized id is replaced with a UUID. Id appears in server logs |
| 4 | `npm audit --omit=dev` | 0 vulnerabilities |
| 5 | Admin: Care desk "sensitive unlock" | Works with `ADMIN_SENSITIVE_PASSWORD`. Fails closed if no admin secret is configured in the environment |

### B10. Regression sweep (areas adjacent to the change)

Smoke each once on the preview:

- Email + password login, logout, forgot/reset password.
- Login by phone code and by email code.
- Dual-role: a signed-in customer adds Repair Pro (phone reuse by the same user must be allowed).
- Tier 1 phone verification from the profile, tier 2 ID upload, NIN/BVN verification at signup (valid, invalid, provider unavailable).
- Address search and "use my location" (geocode and reverse-geocode limits).
- Push notification opt-in, a booking request through to payment.
- Admin: Users list, deletion/anonymisation, login.
- Map screens, chat, wallet pages (they share the new headers and proxy).

### B11. Change phone / email from Settings (S1)

Settings -> Profile -> Security. Test as a **customer (no guarantor)** and as a **Repair Pro with a guarantor**.

| # | Steps | Expected |
|---|---|---|
| 1 | Change phone: "Send code to email" -> enter password + the emailed code -> Verify identity | Customer passes with no guarantor field. Pro must enter the guarantor name (wrong name refused) |
| 2 | Enter a NEW number -> Send code | SMS arrives on the new number, worded "Ona verification code" (not "login"), with the WebOTP line |
| 3 | Enter the code | Phone updates, shows verified, role tables updated, audit log row written, "Phone number updated" notification |
| 4 | Repeat for email | Email arrives at the NEW address. Profile email updates. Old email can no longer receive login codes; the new one can |
| 5 | Enter a number/email that another account has (try `0809...`, `+234 809...`) | "already used on another Ona account". No SMS sent |
| 6 | Enter your own current number/email | "That is already your ..." |
| 7 | Wrong code, then 5 wrong codes | Stays on the code step with the message. After 5, locked: tap Resend for a fresh code |
| 8 | Resend before 30 s / after | Blocked with a wait message / sends a new code and the old one stops working |
| 9 | Wait 10+ minutes on the number step, then Send code | Sent back to "Verify your identity" |
| 10 | Request more than 5 codes in a day | Refused (daily cap) |
| 11 | Turn off the provider (S3) | "Verification is not available right now", no code sent, nothing changed |
| 12 | `336699` at the new-contact code step (S1) | **Rejected** |
| 13 | Craft `POST /api/security/action {action:"change_phone", newValue:...}` with only a session token | 403 `identity_required`. With a proof but no code: 400 `code_required`. Profile unchanged |
| 14 | Craft `POST /api/profile/update {phone:"+234..."}` with a different number | 200 but the phone is **not** changed |
| 15 | `GET/POST /api/security/contact-change` without a session | 401. With a session: only your own requests, no `oldCode`/`newCode` in the JSON |

### B12. Change the payout / refund bank account (S1)

Two screens: **Payments -> Bank account details** (everyone) and **Profile -> Payout (Tier 3)** (Repair Pros).
Test both, as a customer and as a Repair Pro, with a saved bank and with none.

| # | Steps | Expected |
|---|---|---|
| 1 | Open Payments -> Bank account details with a saved bank | The saved-account card shows first (it used to drop straight into the edit form) |
| 2 | Tap Edit | "Verify it's you". No form, and **no SMS** until you tap Send security code |
| 3 | Send security code | SMS to the phone **on the account** (the browser cannot choose the number), worded "Ona verification code", with the WebOTP line |
| 4 | Enter the code | Form appears. Wrong code: stays on the step, box cleared, Resend available. 5 wrong: locked, ask for a new code |
| 5 | Change the account and Save | "Bank saved successfully". Both role rows updated, audit row `change_bank` (critical), "Bank account updated" notification |
| 6 | Use an account number another user already has | "already used on another Ona account", nothing saved |
| 7 | Wait 10+ minutes after verifying, then Save | Sent back to "Verify it's you", nothing saved |
| 8 | Same flow from Profile -> Payout (Repair Pro) | Same behaviour |
| 9 | No saved bank (new user, bank setup gate, force panel) | **No verification**: first-time setup saves directly, as before |
| 10 | Account with no phone number | "Add a phone number ... before changing your bank account"; no SMS |
| 11 | Provider off (S3) | "Verification is not available right now"; bank unchanged |
| 12 | `336699` at the code step (S1) | **Rejected** |
| 13 | Craft `POST /api/security/action {action:"change_bank", newValue:...}` with only a session token | 403 `verification_required`. Bank unchanged |
| 14 | Craft `POST /api/profile/update {bankAccountNumber:"<different>", bankCode:"..."}` | 403 `bank_change_requires_verification`, **nothing** in that request is saved |
| 15 | Normal profile save (any field) while a bank is saved | Works. The unchanged bank values the app sends do not trigger the 403 |
| 16 | Dual-role user (customer + Repair Pro) with one bank | Saving as either role works with no false rejection |
| 17 | A bank on payouts in flight / cashout after a change | Next payout uses the new account only; confirm with a small test payout |

---

## C. Exit criteria

Go-live is acceptable when **all** of these hold:

1. Part A green on the exact commit being deployed.
2. Every S1 case in B1-B3 and B8 passes, and `336699` is rejected on phone, email and signup in S1.
3. SMS arrives on all four networks within an agreed latency (suggest under 30 s at the 95th percentile).
4. No new CSP violations unexplained. The header stays report-only until step B9.2 is clean.
5. No P1/P2 accessibility defect in B6.
6. Rollback is rehearsed (Part D).

## D. Rollback

- Provider trouble: fix or restore the provider variables. **Do not** turn the demo flags on in
  production, because that reopens `336699` for every account.
- Bad release: redeploy the previous Vercel build. The migration set is unchanged by this work, so no
  database rollback is needed.
- A CSP problem: it is report-only and cannot block users. Removing it needs only a config change.

## E. Known gaps (not covered by this plan, tracked separately)

- 2FA in Settings is client-side only and not a real second factor. Do not rely on it.
- The bank account NAME is still trusted from the client at change time (the Payments screen resolves it
  through Flutterwave in the browser). Resolve and compare it server-side before payout.
- The audit log stores the full old/new account numbers (`old_value` / `new_value`). Mask them if the table
  is readable beyond Care.
- Changing an email or phone does not yet notify the OLD address/number. Add it now that Resend and SMS exist.
- CSP is report-only and still allows inline scripts.
- Authenticated screens have no automated accessibility scan.

## F. Sign-off

| Area | Environment state | Tester | Date | Result | Notes / ticket |
|---|---|---|---|---|---|
| B1 Signup + verification | S1 | | | | |
| B2 Skip path | S1 | | | | |
| B3 Codes and abuse | S1 | | | | |
| B4 Delivery (4 networks + email) | S1, S4 | | | | |
| B5 Devices and auto-fill | S1 | | | | |
| B6 Accessibility | S1 | | | | |
| B7 Rate limiting and Redis | S1 | | | | |
| B8 Data and security | S1 | | | | |
| B9 Headers, proxy, dependencies | S1 | | | | |
| B10 Regression sweep | S1 | | | | |
| B11 Change phone / email (Settings) | S1, S3 | | | | |
| B12 Change bank account | S1, S3 | | | | |
| Staging demo behaviour | S2, S3 | | | | |
