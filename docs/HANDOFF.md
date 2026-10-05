# Ona — human developer handover

**Last reviewed:** 2026-10-05  
**Do not rewrite the product or the visual system.** Finish, secure, and own.

This file is the index. Read it once, then follow the frozen docs and the code.

---

## Read in this order

1. This file
2. `docs/RULES.md` — fees, 14 trades, split, Express, timers, **protected files (§10)**
3. `docs/ANTI_REGRESSION.md` — bugs that already shipped once
4. `docs/UI.md` — phone shell, colour, chrome (do not restyle)
5. `src/lib/jobs/constants.ts` + `src/lib/jobs/state-machine.ts`
6. `docs/PAYOUT_SYNC_RELEASE.md` — job escrow transfers
7. Shop: `docs/ONA_SHOP_ARCHITECTURE.md` (boundaries) + `docs/ONA_SHOP_PHASE3_REPORT.md` (as-built)

Then `docs/CODEMAP.md` to find files (route groups, folder conventions, domain map). CODEMAP is a map, not a spec.

Search, offline and accessibility rules and measurements: `docs/PERFORMANCE_AND_ACCESSIBILITY.md`.

Setup guides: `docs/SUPABASE_SETUP.md`, `docs/GOOGLE_MAPS_SETUP.md`, `docs/VERCEL_DEPLOY.md`, `docs/HANDOFF_KEYS.md` (payment keys, payout proxy), `docs/CLEAN_START_TESTING.md` (reset test data). Ops: `docs/CUSTOMER_CARE.md`.

---

## Code layout (after the modularity refactor)

- **Files are kept at or under 300 lines.** Large modules are a thin barrel plus a folder of the same name (see CODEMAP §2). Keep it that way; do not grow a file back into a monolith.
- **Routes live in route groups** — `(onboarding)`, `(customer)`, `(artisan)`, `(shared)` — which do not change URLs (CODEMAP §1). `admin/` and `api/` are at the top level.
- Client state: `src/lib/store.tsx` composed from `src/lib/store/*` hooks. Server job store: `src/lib/server/jobs/job-store/` (a folder).
- Still over 300 lines (non-component `.ts`): the server layer and a few logic modules (for example `src/lib/server/security/security-store.ts`, `src/lib/supabase/app-api.ts`, `src/lib/server/payments/providers.ts`, `src/lib/server/pairing/pairing-engine.ts`, several API routes). Split them only with the existing tests, one concern per commit, and never inside the protected files.

---

## Do not rebuild these (already shipped)

| Domain | Live source |
|--------|-------------|
| Call-out | `src/lib/callout/*` + tests |
| Split 87.5 / 5 / 7.5 on **total** (labour + call-out) | `src/lib/pricing.ts` |
| SSPE pairing (144s, 1–5 km) | `src/lib/server/pairing/pairing-engine.ts`, merit-engine, migration `047` |
| Job escrow + Flutterwave payout | `payout-settlement.ts`, `providers.ts` |
| Shop retail (not job escrow) | `src/lib/server/shop/*` |
| Express (no SSPE) | `src/lib/express/pricing.ts` |
| Phone shell / Call / Back | `docs/ANTI_REGRESSION.md`, `docs/UI.md` |

`docs/SSPE_REFACTOR_PLAN.md` is **historical**. Ignore 66s and 15–50 km. It is kept because source files and a migration comment cite it.

---

## One product decision still open

**Wallet — pick one, then implement gaps:**

- **v1 as-built** (recommended default): `docs/DESIGN_wallet_cashout.md` + `src/lib/server/security/cashout-engine.ts` (`ona_cash_*`).
- **v2 draft:** `docs/WALLET_CASHOUT_DESIGN.md` — **not approved**. Collides with v1 and with Express migration `076`. The files it lists under `src/lib/server/modules/wallet/` and several migrations do not exist yet; they are proposals.

Do not invent a third ledger. Stub tables `wallet_accounts` stay unused.

---

## Security items to act on first

1. **Rotate the Flutterwave payout-proxy secret.** `Local BackUp/payout-proxy-vercel-env.txt` (URL + secret) was committed to git. It is untracked now, but it remains in git history and on the remote. Rotate `FLUTTERWAVE_TRANSFER_PROXY_SECRET` on the proxy and in Vercel, and consider purging history.
2. **Demo OTP is on in production by default** (`src/lib/auth/demo-otp.ts`). It stays on unless **both** `OTP_DEMO_MODE` and `NEXT_PUBLIC_OTP_DEMO_MODE` are exactly `false`. Turn it off when SMS is live.
3. **Admin unlock signing secret has a hard-coded fallback.** The unlock *password* correctly requires `ADMIN_SENSITIVE_PASSWORD` (it throws if unset). But the unlock *cookie signing secret* (`signingSecret()` in `src/lib/server/modules/sensitive-unlock.ts`) uses the first of `ADMIN_UNLOCK_SIGNING_SECRET`, `ADMIN_FIELD_ENCRYPTION_KEY`, `ADMIN_SENSITIVE_PASSWORD`, and falls back to a fixed string when none is set and demo OTP is allowed. Make at least one mandatory in production and drop the fallback. Several code comments (`security.ts`, `sensitive-unlock.ts`, the unlock route) still say the default password is the demo code; that is stale and should be removed.
   - **Idle timeout:** `ADMIN_IDLE_TIMEOUT_MS` is 4 hours but its comment says 30 minutes. Decide the intended value.
4. **Calls rely on a free public TURN relay** (`openrelay.metered.ca`, shared credentials in `src/components/call/in-app-call/helpers.ts`). Use a dedicated TURN before relying on calls at scale.
5. In-memory fallbacks in `job-store` `listJobsForUser` and `security-store.ts` are unsafe on multiple serverless instances.

---

## Leftover work (gap-fill, not redesign)

**Product / backend**

- Shop: no `/shop/search` page (API exists); no `/shop/saved` (table exists)
- Artisan onboarding still uses `localStorage` (`src/lib/artisan/local-store.ts`) while `/api/artisan/profile` exists
- Notification settings UI ≠ `/api/notifications/settings` contract
- `src/components/jobs/job-flow-screen/use-job-load.ts` calls `router.back()` for unpaid Express drafts, which `docs/ANTI_REGRESSION.md` §3 forbids
- Vercel crons are daily (Hobby plan), so server sweeps run once a day; the client sweep keeps deadlines near-real-time (see `docs/VERCEL_DEPLOY.md`)
- `split95_5` **name** still returns 87.5/5/7.5 — do not “fix” the name into 95/5 math
- A few `eslint-disable` comments remain where a dependency array would change behaviour; fix them in their own change

**UI/UX (finish inside the freeze — see `docs/UI.md`)**

- Settings: Export personal data, Blocked users still “coming soon”
- `/wallet` chrome still titled Referral & Earn; cashout UI is amount-only
- Notification settings still says “Server sync coming soon”

**Search / performance / accessibility follow-ups** (see `docs/PERFORMANCE_AND_ACCESSIBILITY.md` §6)

- About 310 KB (gzipped) of shared JS remains per page; defer the Supabase client off the sign-in path and lazy-load Google Maps
- `/signup/pro` and `/artisan/onboarding` still ship the places data eagerly
- The Privacy Policy and Terms are short summaries with a personal Gmail contact; they need real legal text
- Brand icons and the share image are cropped from the hero photo; replace with a proper logo mark
- Signed-in screens are only covered by `jsx-a11y` lint; test with a keyboard and a screen reader
- `public/sw.js` caches pages and images only; a real offline action queue was deliberately not built (money and job actions must be explicit)

**Do not** redo incoming-request panel geometry, copper accent, 6px radius, or light `#c8c9cd` / dark black chrome.

---

## Run / gate

```bash
npm install
cp .env.example .env.local   # fill real values; .env.example lists every variable the code reads
npm run dev                  # http://localhost:3000
npm run dev:admin            # http://localhost:4500/admin
```

Without `.env.local` the app has no database and the UI stays on its loading state (`/api/sessions` returns `503 no_db`).

Before any commit:

```bash
npm run lint && npm run typecheck && npm run test
```

`npm run lint` must have **0 errors**. Remaining items are warnings (unused vars, hook deps) — do not add `any`, and do not mix warning cleanup with a product change.

Smoke: `docs/ANTI_REGRESSION.md` §8 (Call, Chat, Back, multi-request, negotiate 20 min / 6 offers). Unit tests do not cover most screens, so click through the areas you touched.

Production: https://ona-mi.vercel.app — ops keys in `docs/HANDOFF_KEYS.md` (never commit secrets).

---

## Protected files

Fee / assignment / timer files are listed in `docs/RULES.md` §10. Do not regenerate. Change only with tests + human review.
