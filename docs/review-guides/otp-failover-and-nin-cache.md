# OTP SMS failover and NIN lookup cache review guide

## Goal

Keep OTP login and NIN checks working when one outside provider is down (tracking items ONA-ID-101 and ONA-ID-203, batch 3 of 3).

Agreed plan (approved by the repository owner on 2026-11-13):

8. Put SMS sending behind a provider interface with ordered failover. Add one second adapter, gated by environment variables and off unless configured. Test failover with fakes.
9. Cache successful NIN lookups as an outage fallback: hashed key, never the raw number, with an expiry. Add a migration file following the existing numbering.

This branch starts from `feat/server-side-id-verification` (batch 2), which starts from batch 1: it builds on their `otp-delivery.ts`, `prembly-core.ts` and `id-lookup.ts`.

## Design notes

- **Provider order.** `SMS_PROVIDER_ORDER` (default `africastalking,termii`) lists adapters in the order to try. Adapters that are not configured are skipped. The second adapter is Termii, written from its public "Send Message" documentation (`POST {base}/api/sms/send`); it is off until `TERMII_API_KEY`, `TERMII_SENDER_ID` and `TERMII_BASE_URL` are all set.
- **When the next provider is tried.** Any failed send moves on to the next configured provider. An invalid phone number fails at once without calling anyone.
- **Cache is a fallback only.** A live NIN confirmation is written to `id_lookup_cache`. The cache is read only when the provider cannot answer (network error, timeout, 408, 429, 5xx). A provider rejection, a missing provider key, and auth or billing errors (401/402/403) never fall back to it.
- **No raw numbers.** The cache key is an HMAC-SHA256 of the number under a server secret (`ID_LOOKUP_CACHE_SECRET`, else the service-role key). A plain hash of an 11-digit number could be reversed by trying every number; a keyed hash cannot without the secret. With no secret the cache is off.
- **Expiry.** Entries expire after `ID_LOOKUP_CACHE_TTL_DAYS` (default 30). Expired rows are ignored on read and removed on the next write.
- **Visible to Care.** A result served from the cache carries `cached: true`, and the stored lookup record does too.

## Expected change areas

- `src/lib/server/sms/` (new): `types.ts`, `termii.ts`, `providers.ts`, `send.ts`.
- `src/lib/server/auth/otp-delivery.ts`, `src/lib/server/notifications-retry.ts` — send through the failover.
- `src/lib/server/identity/nin-cache.ts`, `src/lib/server/identity/nin-lookup.ts` (new); `src/lib/server/identity/id-lookup.ts`, `src/app/api/verify/nin/route.ts` — use the fallback; `src/lib/server/prembly-core.ts` — outage classification and the `cached` marker.
- `supabase/migrations/20261113_084_id_lookup_cache.sql` (new), `.env.example`, `docs/BACKEND_FIXES_STATUS.md`.

Protected files (`docs/RULES.md` §10) are not touched.

## Reviewer procedure

Inspect each requirement in `otp-failover-and-nin-cache.json` against the reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

| ID | Requirement | Expected behaviour | Verification | Evidence |
|---|---|---|---|---|
| R1 | Provider interface with ordered failover | `sendSms` tries configured providers in `SMS_PROVIDER_ORDER`, returns the first success with the provider name, and reports every failed attempt. Unconfigured and unknown names are skipped. | Unit test with fake providers | code |
| R2 | Second adapter is off unless configured | The Termii adapter is configured only when key, sender ID and base URL are all set, sends the documented request body, and treats non-2xx or a body without a message id as failure. | Unit test with a stubbed `fetch` | code |
| R3 | OTP and queued SMS use the failover | Phone OTP is deliverable when any provider is configured, and a failed first provider still delivers through the second. `notifications-retry` sends through the same path. | Unit and route tests | code |
| R4 | NIN cache as outage fallback | A live confirmation is cached. During a provider outage a fresh entry is returned with `cached: true`; a miss or an expired entry returns the outage. Rejections and a missing key never use the cache. | Unit test | code |
| R5 | No raw number, with expiry | The cache key is a keyed hash; neither key nor stored value contains the number; entries carry `expires_at`; with no secret the cache is off. Cache failures never break a lookup. | Unit test; migration inspection | code |
| R6 | Migration | `id_lookup_cache` is created with RLS forced and no access for `anon` / `authenticated`, following the existing numbering. | File inspection | code |
| R7 | No regressions | `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:server-boundaries`, `npm run check:openapi-drift` pass. | Automated commands | code |
| R8 | Hosted behaviour | With both SMS providers set, an OTP arrives through the second when the first is disabled. With the migration applied, a NIN checked once is served from the cache during a simulated outage. | Live QA | live |

## Boundaries and limitations

- The Termii adapter has not been run against the live API. Its request and success shape come from the public documentation; error bodies are not documented there, so any non-2xx is treated as a failure with the HTTP status.
- No circuit breaker: every send tries the first provider first, so an outage adds that provider's failure time to each OTP.
- A provider that accepts a message but never delivers it looks like a success; delivery receipts are not read.
- Only NIN lookups are cached. BVN lookups are not.
- The migration is a file only; it has not been applied to any hosted database. Until it is, cache reads and writes fail quietly and lookups behave as before.
- Cached entries hold the holder's name and the provider reference for up to the TTL.
- `/api/security/action` and the contact-change flow were not moved to the failover.

## Remaining work

See the JSON guide (`remainingWork.code` and `remainingWork.external`).

## Closeout

`docs/BACKEND_FIXES_STATUS.md` carries the same state and residuals under "Identity hardening batch 3".
