# OTP and ID lookup hardening review guide

## Goal

Close four cheap security and login-breaking gaps in phone/email OTP and in the NIN/BVN lookup endpoints (tracking items ONA-ID-101, ONA-ID-203, ONA-ID-205, batch 1 of 3).

Agreed plan (approved by the repository owner on 2026-11-13):

1. The demo OTP code is accepted in production only when an environment flag is explicitly true. Local and test behaviour is unchanged.
2. When an OTP cannot be delivered and the demo code is not in play, `POST /api/auth/otp/send` returns a clear error instead of "Code sent", and leaves no stored code the user could never receive.
3. Email OTP is delivered through the existing Resend helper when it is configured. With no delivery and no demo mode the route fails clearly.
4. `/api/verify/nin` and `/api/verify/bvn` fail closed in production when no provider key is set (the format-only pass stays outside production), and both are rate limited per IP. They stay unauthenticated because signup calls them before a session exists.

## Expected change areas

- `src/lib/auth/demo-otp.ts` — production default flips from "allowed unless set to false" to "allowed only when set to true".
- `src/lib/server/auth/otp-delivery.ts` (new) — delivery plan (real / demo / unavailable), SMS and email send, error messages.
- `src/app/api/auth/otp/send/route.ts` — sends before storing; maps delivery errors to `502 otp_delivery_failed` / `503 otp_delivery_unavailable`.
- `src/lib/server/prembly.ts` — production fail-closed result `NOT_CONFIGURED` when no key.
- `src/lib/server/identity/id-lookup-guard.ts` (new) and `src/app/api/verify/{nin,bvn}/route.ts` — per-IP rate limit and status mapping.
- Tests beside each of the above, `.env.example`, `docs/BACKEND_FIXES_STATUS.md`.

Protected files (`docs/RULES.md` §10) are not touched.

## Reviewer procedure

Inspect each requirement in `otp-and-id-lookup-hardening.json` against the reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

| ID | Requirement | Expected behaviour | Verification | Evidence |
|---|---|---|---|---|
| R1 | Demo OTP is opt-in in production | With `NODE_ENV=production`, `isDemoOtpAllowed()` is true only when `OTP_DEMO_MODE` or `NEXT_PUBLIC_OTP_DEMO_MODE` is `true` or `1`; unset, empty, `false` and masked values are false. Outside production it stays true. | Unit test | code |
| R2 | No false "Code sent" | When delivery fails and demo is not allowed, the send route returns `502 otp_delivery_failed`, writes nothing to `phone_otps` and does not consume earlier codes. | Route test | code |
| R3 | Email OTP uses real delivery when configured | With Resend configured, an email code is random (not the demo code), is emailed, and only then stored. With no Resend and no demo the route returns `503 otp_delivery_unavailable`. Same for phone with no SMS provider. | Route test | code |
| R4 | ID lookup fails closed in production | With no provider key and `NODE_ENV=production`, NIN and BVN lookups return `ok: false`, code `NOT_CONFIGURED`, HTTP 503. Outside production the format-only pass is unchanged. | Unit and route tests | code |
| R5 | ID lookup endpoints are rate limited per IP | Both routes call the shared limiter before the provider; an exhausted budget returns 429 with `Retry-After`, a limiter outage returns 503, and the provider is not called in either case. | Route test | code |
| R6 | No regressions | `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:server-boundaries`, `npm run check:openapi-drift` pass. | Automated commands | code |
| R7 | Hosted behaviour | On the deployed app: demo code rejected when the flag is off, real SMS and email codes arrive, NIN/BVN lookups work with the provider key. | Live QA | live |

## Boundaries and limitations

- Does not add a second SMS provider or failover (batch 3).
- Does not move the NIN/BVN lookup to the server or store its result (batch 2). `nin_verified`/`bvn_verified` are still set as before.
- The contact-change flow (`src/lib/server/security/security-store.ts`, `src/app/api/security/action/route.ts`) keeps its own code generation and delivery. With demo mode off it issues random codes; its delivery paths were not changed or audited here.
- The per-IP limit is shared by everyone behind one carrier NAT address. The budget is deliberately generous (20 lookups per 10 minutes per kind) but can still affect busy shared addresses.
- When demo mode is on and real delivery fails, the route still succeeds and stores the demo code, because the demo code is accepted anyway.
- **Deployment risk:** if production relies on the demo code today, merging without `OTP_DEMO_MODE=true` set explicitly locks out OTP login. If production has no ID provider key, NIN/BVN checks at signup start failing with 503.

## Remaining work

- Code: contact-change codes need the same "deliver or fail" treatment; see the JSON guide.
- External: set environment variables and run live QA; see the JSON guide.

## Closeout

`docs/BACKEND_FIXES_STATUS.md` carries the same state and residuals under "Identity hardening batch 1".
