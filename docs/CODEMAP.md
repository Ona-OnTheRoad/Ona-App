# Ona Code Map — where things live

> **A map, not a spec.** Product law is `docs/RULES.md` + `docs/ANTI_REGRESSION.md`. Visual law is `docs/UI.md`. Start at `docs/HANDOFF.md`.
> Paths here are checked by a link checker; line numbers are deliberately not used because they rot.

---

## 1. Route groups (`src/app`)

Pages live in Next.js **route groups**: folders named `(group)` that organise files and are **not part of the URL**, so `src/app/(customer)/shop/page.tsx` still serves `/shop`.

| Group | What lives there |
|-------|------------------|
| `(onboarding)` | `login`, `signup`, `verify`, `logout`, `artisan` (Repair Pro onboarding / verification) |
| `(customer)` | `requests`, `history`, `search`, `bookings`, `express`, `shop`, `technician`, `payments` |
| `(artisan)` | `orders`, `dashboard` (Repair Pro home) |
| `(shared)` | `jobs`, `messages`, `wallet`, `profile`, `settings`, and the home page `/` — used by both roles (one account switches role) |

`admin/` and `api/` stay at the top level of `src/app`.

- Put a new page in the group for the role that owns it; if both roles use it, use `(shared)`.
- Two groups must not serve the same URL (Next errors). Do not add a `layout.tsx` to a group without reading `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`; the single phone shell comes from `src/app/layout.tsx`.
- Imports use `@/...` aliases, so moving a page between groups does not break imports. Update any test that imports `@/app/(group)/...`.
- Route files (`page.tsx`) stay thin: they compose components from `src/components/<feature>/`. Do not put feature modules inside `src/app`.

## 2. Code layout conventions

Files are kept **at or under 300 lines**. A big module becomes a **barrel plus a folder** with the same base name:

```
src/components/auth/pro-signup.tsx      # thin composition + same public exports
src/components/auth/pro-signup/         # step components, use-*.ts hooks, helpers, types
```

- The original path keeps exporting the same names, so importers never change. Both `foo.tsx` and `foo/` can coexist; `@/…/foo` resolves to the file.
- `use-*.ts` = stateful logic, `*-view.tsx` / `*-section.tsx` = presentation, `types.ts` / `constants.ts` / `helpers.ts` = the rest.
- Large **data** modules (question trees, catalogs, i18n) are split by section and re-assembled in the barrel; the exported value must stay identical.
- Client app state is `src/lib/store.tsx` (provider, `useApp()`), built from domain hooks in `src/lib/store/`.
- Types are re-exported from `src/lib/types.ts`; the declarations live in `src/lib/types/`.

## 3. Domain map

### Fees and pricing
| Concern | Where |
|---------|-------|
| Split 87.5 / 5 / 7.5 on the **total** (labour + call-out) | `src/lib/pricing.ts` — `splitServiceChargeMinor`, `buildCustomerChargeMajor`, `PLATFORM_COMMISSION_PERCENT`, `VAT_PERCENT_NG`, `PRO_NET_PAYOUT_PERCENT` |
| Display total shown to the customer | `src/lib/callout/payable.ts` — `getDisplayTotalMajor`, `payableCalloutMajor`, `jobTotalMajor` |
| Server payout | `src/lib/server/payments/payout-settlement.ts` — `attemptProPayout`; `split95_5` is a legacy **name** that still returns 87.5/5/7.5 |
| **Rule** | Every split uses `total`, never labour alone. Do not "fix" the `split95_5` name into 95/5 math. |

### Call-out engine
`src/lib/callout/` — `constants.ts` (fees, multipliers), `engine.ts` (pure pricing + eligibility), `payable.ts`, `urgency.ts`, tests in `__tests__/`.

### Jobs, state machine, negotiation
| Concern | Where |
|---------|-------|
| Timing, offers, statuses (single source) | `src/lib/jobs/constants.ts` |
| Deadlines / countdowns | `src/lib/jobs/deadline.ts`, `countdown-math.ts`, `use-exact-countdown.ts` |
| State machine | `src/lib/jobs/state-machine.ts` |
| Types | `src/lib/jobs/types.ts` |
| Client API | `src/lib/jobs/client.ts` |
| Server job store (a folder, one file per concern) | `src/lib/server/jobs/job-store/` — `index.ts`, `create`, `reads`, `transitions`, `payments`, `dispatch`, `negotiation`, `disputes`, `expiry`, `recovery`, … |
| Job UI | `src/components/jobs/` (`job-flow-screen/`, `motorist-release-pay-gate/`, `live-job-track-map/`, …) |
| Transition API | `src/app/api/jobs/[id]/transition/route.ts` |

The jobs table is **`service_requests`** (offers and dispute data are JSON columns on it), with `job_status_events` and `job_events` for history.

### Pairing (SSPE) and merit
`src/lib/server/pairing/pairing-engine.ts` (sequential pairing, 144 s window), `src/lib/server/merit/merit-engine.ts`. Cron: `/api/jobs/pairing-sweep` (schedule in `vercel.json`). `docs/SSPE_REFACTOR_PLAN.md` is historical; its numbers are stale.

### Payments and escrow
`src/lib/server/payments/` — `escrow-store.ts`, `payout-settlement.ts`, `payout-ledger.ts`, `providers.ts` (Flutterwave), `self-payment-guard.ts`. API: `src/app/api/payments/`. Customer pages: `src/app/(customer)/payments/`. Payout proxy: `tools/flw-payout-proxy/`.

### Wallet and cashout
Live path: `src/lib/server/security/cashout-engine.ts`, `credit-wallets.ts`, `cashout-requests.ts`. `src/lib/server/modules/wallet/` is a stub (see its README). Design: `docs/DESIGN_wallet_cashout.md` (v1, as built); `docs/WALLET_CASHOUT_DESIGN.md` is the unapproved v2 draft.

### Express (no SSPE)
`src/lib/express/pricing.ts`, `src/lib/express/question-engine.ts`, UI in `src/components/express/`, page `src/app/(customer)/express/`.

### Shop (retail, not job escrow)
| Concern | Where |
|---------|-------|
| Catalogs | `src/lib/shop/automedics-catalog.ts` (real SKUs), `vulcanizer-catalog.ts`, `demo-catalog.ts` (demo only) |
| Taxonomy / attributes | `src/lib/shop/taxonomy.ts`, `trade-attributes.ts`, `vulcanizer-taxonomy.ts` |
| Client / status | `src/lib/shop/client.ts`, `catalog-status.ts` |
| Server | `src/lib/server/shop/` and `src/app/api/shop/` |
| UI | `src/app/(customer)/shop/`, `src/components/shop/` |
| Architecture | `docs/ONA_SHOP_ARCHITECTURE.md`, `docs/ONA_SHOP_PHASE3_REPORT.md`, `docs/MECHANIC_SHOP.md` |

### Trades (14) and help flows
Question trees: `src/lib/<trade>/question-tree.ts` (mechanic, battery, vulcanizer, carpenter, painter, diagnostics, tow, generator, solar, plumber, fashion, ac, body, electrical). Per-trade help-flow configs: `src/components/home/help-flow-configs/`.

### Identity, auth, security
`src/lib/server/identity/`, `src/lib/auth/` (including `demo-otp.ts`), `src/lib/server/security/`, `src/app/api/auth/`, `src/app/api/verify/`, `src/app/api/security/`.

### Notifications, push, calls, chat
`src/lib/notifications/`, `src/lib/push/`, `src/components/notifications/`; calls in `src/components/call/in-app-call/` (signaling through the `call_signals` table, see `docs/ANTI_REGRESSION.md` §7); chat in `src/app/(shared)/messages/` and `src/components/messages/`.

### Admin (Care desk)
`src/app/admin/`, `src/components/admin/`, `src/app/api/admin/`, `src/lib/server/modules/` (RBAC, care service, sensitive unlock).

### Maps, i18n, config
`src/components/map/`, `src/lib/i18n/` (11 languages; see `src/lib/i18n/TRANSLATION.md`), `src/lib/app-config.ts` (central runtime config).

### Search, offline and low-data support
`src/lib/site.ts`, `src/app/robots.ts`, `sitemap.ts`, `manifest.ts`, `src/lib/seo/`, `src/components/seo/`,
`public/sw.js`, `public/offline.html`, `src/components/pwa/`, `src/lib/network/`, `src/lib/image-compress.ts`,
`scripts/generate-brand-icons.mjs`, `scripts/verify/`. Rules and measurements: `docs/PERFORMANCE_AND_ACCESSIBILITY.md`.

## 4. Database

`supabase/migrations/` holds the numbered SQL migrations. Apply with `npm run db:apply`; seed and sync scripts are in `scripts/` and listed in `package.json`. Do not edit an applied migration; add a new one.

## 5. Tests

| Test | Covers |
|------|--------|
| `src/lib/__tests__/pricing.test.ts` | split and customer charge |
| `src/lib/callout/__tests__/` | call-out engine, payable, urgency |
| `src/lib/jobs/__tests__/` | state machine, deadlines, incoming-popup timing |
| `src/lib/notifications/__tests__/` | toast gating and stack rules |
| `src/app/api/__tests__/` | API routes |
| `src/lib/shop/__tests__/`, `src/lib/__tests__/shop-ui-scope.test.ts` | shop logic and UI scope |
| `src/components/**/__tests__/` | component behaviour (call-out fee on card, incoming popup close, inbound banner, orders page) |

## 6. Protected files

The list of files that must not be regenerated or changed without human review is **`docs/RULES.md` §10**. It is not repeated here so there is one copy to keep current.

## 7. Commands

```bash
npm run dev          # http://localhost:3000 (admin: /admin)
npm run build        # production build
npm run lint && npm run typecheck && npm run test   # pre-merge gate
npm run db:apply     # apply migrations
npm run db:sync      # sync DB
```
