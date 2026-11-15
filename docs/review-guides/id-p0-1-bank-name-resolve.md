# ID P0-1: bank account name is resolved by the server

## Goal

The account holder name stored against a payout or refund bank account always comes from the bank (Flutterwave account resolve), never from the request body. The BVN/NIN name comparison, the transfer beneficiary name and the admin bank view all read that resolved name.

Agreed decisions:

- **Lookup unavailable at signup or first-time bank setup:** the account is saved with an empty name and marked unresolved. Nothing is paid to it until it resolves.
- **Lookup unavailable on a bank change:** the change fails closed and the old bank stays.
- **Resolved name does not match the profile or BVN name:** saved and flagged for Care, not rejected. Showing that flag on the review screen is ID P0-5.
- **The bank says the account does not exist:** rejected on every path.

## Plan

1. **Shared resolver.** `src/lib/server/payments/resolve-account.ts` returns `resolved` (name), `not_found` or `unavailable`. `POST /api/payments/resolve-account` becomes a thin wrapper around it. The route accepts callers without a session, because the signup bank step runs before an account exists: anonymous callers get 10 lookups per 10 minutes per client IP (fail closed if the limiter is down), signed-in callers keep 20 per minute per user.
2. **Provenance.** A migration adds `bank_account_resolved_at` to `motorist_profiles` and `repair_pro_profiles`. `payout_methods.verified` is set from it instead of always `false`. Existing rows keep their typed name with `bank_account_resolved_at` null, which means "self-declared".
3. **Write paths.** Signup, `POST /api/profile/update` and `change_bank` in `POST /api/security/action` drop the client's `bankAccountName` and store the resolver's answer. The field stays in the request schemas so older clients do not break; its value is ignored. A profile save that carries only a name is a no-op for the name.
4. **BVN/NIN comparison.** Signup resolves before the ID lookup and compares against the resolved name. When a name is resolved later, the stored comparison in `gov_id_meta` is recomputed from the holder name already on record, with no new provider call.
5. **Paying out.** `loadProBankDetails`, `loadMotoristBankDetails` and `getBankOnFile` return a bank only when it is resolved. An unresolved row is resolved at that moment and stored; if that fails, the payout stays in escrow as it does today for an incomplete bank. `payout-settlement.ts` (protected) is not edited.
6. **Client.** The account name input is read-only once the bank has answered. It stays editable when the lookup fails, so signup is not blocked; whatever is typed there is not stored. No restyle.
7. **Admin.** `GET /api/admin/pros/[id]/bank` returns `nameResolvedAt` so Finance can tell a bank-confirmed name from a legacy one.

## Expected change areas

- New: `src/lib/server/payments/resolve-account.ts`, one migration (`085`).
- Edited: `src/app/api/payments/resolve-account/route.ts`, `src/lib/server/signup/{pro-profile,motorist-profile}.ts`, `src/app/api/auth/signup/route.ts`, `src/app/api/profile/update/route.ts`, `src/app/api/security/action/route.ts`, `src/lib/server/payments/bank-lookup.ts`, `src/lib/server/security/cashout-engine.ts`, `src/lib/server/identity/{identity-sync,id-lookup}.ts`, `src/app/api/admin/pros/[id]/bank/route.ts`, the two bank field components.
- Protected rules to preserve: no edit to `payout-settlement.ts`, fee or split logic, or the job store. Files stay at or under 300 lines; the two large routes get their bank block moved out, not grown.

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON guide against the exact reviewed commit. Record concrete implementation/test evidence and live evidence separately. Never mark an unrun check passed.

## Boundaries and limitations

- Not in scope: showing the mismatch flag on the Care review screen and stopping Care from approving over it (ID P0-5); an outage cache or failover for the resolver (P2).
- The resolver depends on `FLUTTERWAVE_SECRET_KEY`. Local development without the key needs an explicit non-production stand-in so mock payouts still run; it must be impossible to reach in production.
- The anonymous lookup is a public bank-name lookup bounded only by the per-IP budget. A request with no client IP header is not limited (shared helper behaviour); the hosted platform always sets one.
- Flutterwave test keys resolve only their documented test accounts. Real-account behaviour can only be confirmed on the hosted environment.

## Remaining work

**Code**

- ID P0-5: show the name mismatch on the Care review screen and stop approval over it.
- `POST /api/verify/pro-id` still compares against the stored bank name, which can be a legacy typed name until that account is next confirmed.
- Tests not written: the full signup route, `getBankOnFile`, the admin bank route, the bank form components. The manual UI check was not run.
- `bank-change-flow.tsx` still shows a typed name field; the server discards it.
- Files already over 300 lines grew slightly (`profile/update/route.ts` +9, `security/action/route.ts` +20, `identity-sync.ts` +9).
- Optional one-off backfill so legacy accounts are confirmed before their next payout.

**External**

- Apply migration `085` on the hosted database **before** deploying this code. The code reads and writes `bank_account_resolved_at`; without the column, signup, bank saves and payout bank lookups fail.
- Confirm the live Flutterwave key resolves real accounts on signup, bank change and a legacy payout.
- After release, watch for payouts held with "Repair Pro bank incomplete": these are legacy accounts the bank could not confirm.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the issue state and the same remaining code and external work, and fill `remainingWork` in the paired JSON guide.
