# Signup route split review guide

## Goal

Bring `src/app/api/auth/signup/route.ts` (1,222 lines) under the 300-line limit in `docs/HANDOFF.md` without changing what signup does.

Agreed plan (requested by the repository owner on 2026-11-13): move each section of the handler, unchanged and in the same order, into focused modules under `src/lib/server/signup/`. `route.ts` stays as the entry point and calls them in the original sequence.

This branch starts from `feat/server-side-id-verification` (PR #81), which changes the same file.

## Expected change areas

| New module | What moved into it |
|---|---|
| `schema.ts` | request body schema and its type |
| `context.ts` | the per-request values every step shares |
| `helpers.ts` | password client, `last4`, skill-answer slimming, cert size cap, auth error wording, signup event log |
| `preflight.ts` | age gate, dual-role attach lookup, phone uniqueness |
| `account.ts` | create the auth user or attach the role; base profile row |
| `motorist-profile.ts` | customer side table |
| `pro-fields.ts` | Repair Pro derived fields (services, prices, focus, certificate) |
| `pro-profile.ts` | Repair Pro side table and guarantor |
| `aftercare.ts` | identity sync, merge detection, referral code and referral event |
| `session.ts` | browser session, confirmation email, success response |

`src/app/api/auth/signup/route.ts` keeps parsing, the rate limit, the ID check and the call order. No other file changes behaviour. Protected files (`docs/RULES.md` §10) are not touched.

## Reviewer procedure

Inspect each requirement in `signup-route-split.json` against the reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

| ID | Requirement | Expected behaviour | Verification | Evidence |
|---|---|---|---|---|
| R1 | Every file is at most 300 lines | `route.ts` and each new module are at or under 300 lines. | `wc -l` | code |
| R2 | Same steps in the same order | Validation, rate limit, age gate, attach lookup, phone check, ID check, account, profile, role table, lookup store, identity sync, merge detection, referral, session and response run in the original order. | Read `route.ts` against the previous version | code |
| R3 | Moved code is unchanged | Apart from indentation, function wrappers and `return` of shared values, the statements in each module match the previous file. | Line comparison of old and new statements | code |
| R4 | Behaviour is unchanged | The existing signup route tests pass without edits. | `vitest` on the signup tests | code |
| R5 | No regressions | `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:server-boundaries`, `npm run check:openapi-drift` pass, with no new lint warnings. | Automated commands | code |
| R6 | Hosted behaviour | Customer signup, Repair Pro signup and dual-role attach work on a deployed build. | Live QA | live |

## Boundaries and limitations

- No behaviour, wording, status code or write is meant to change. Anything that looks like a bug in the moved code is left as it is and listed below rather than fixed here.
- The signup tests cover 11 cases. Paths with no test (profile retry without gender/date of birth, the missing-session response, referral handling, the guarantor write, most Repair Pro field derivation) are protected only by the line comparison in R3.
- The other oversized files (`admin/pro-review/route.ts`, `admin/customer-review/route.ts`, `identity-sync.ts`) are not split here.

## Remaining work

See the JSON guide (`remainingWork.code` and `remainingWork.external`).

## Closeout

`docs/BACKEND_FIXES_STATUS.md` carries the same state under "Signup route split".
