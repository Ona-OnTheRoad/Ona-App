# Ona

Nigeria-first live dispatch: customers and Repair Pros (14 trades), escrow-protected jobs, Shop, Express and an admin care desk, in a mobile-first installable web app.

This README is how to run, check and ship the app. **Product and UI rules live in `docs/` — do not redesign from this page.**

| Start here                                        | File                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| Handover                                          | [`docs/HANDOFF.md`](docs/HANDOFF.md)                                             |
| Product rules (fees, escrow, timing)              | [`docs/RULES.md`](docs/RULES.md)                                                 |
| UI system (Ona UI v2, toasts, theme, PWA nudge)   | [`docs/UI.md`](docs/UI.md)                                                       |
| Design gaps (what differs from the Figma and why) | [`docs/DESIGN_GAPS.md`](docs/DESIGN_GAPS.md)                                     |
| Anti-regression rules                             | [`docs/ANTI_REGRESSION.md`](docs/ANTI_REGRESSION.md)                             |
| Code map                                          | [`docs/CODEMAP.md`](docs/CODEMAP.md)                                             |
| Deploy and cron                                   | [`docs/VERCEL_DEPLOY.md`](docs/VERCEL_DEPLOY.md)                                 |
| Accessibility, SEO and offline                    | [`docs/PERFORMANCE_AND_ACCESSIBILITY.md`](docs/PERFORMANCE_AND_ACCESSIBILITY.md) |

## Stack

- **Next.js 16** (App Router) and **React 19**, **TypeScript**
- **Tailwind CSS v4** with the `ona-*` design tokens (see `src/app/globals.css`)
- **shadcn-style UI** in `src/components/ui/` (Radix primitives, `class-variance-authority`, `tailwind-merge`, lucide icons), **Sonner** toasts, **react-floating-dock** bottom navigation
- **Supabase** (Postgres, Auth, Storage, Realtime)
- **Flutterwave** payments (escrow jobs; Shop and Express are separate flows)
- 11 languages through `t("key")` (`src/lib/i18n`), light and dark theme that follows the device until the user chooses, installable PWA (service worker, manifest, install nudge)
- Phone-shell layout (`#ona-phone`, 390×844) for the consumer app

## Getting started

Requires **Node 20** (what CI uses) and a Supabase project.

```bash
npm install
cp .env.example .env.local     # fill in the values; the template lists every variable the code reads
npm run db:setup               # first time only: schema + migrations + admin seed (see below)
npm run dev
```

- App: <http://localhost:3000>
- Admin care desk: <http://localhost:3000/admin/login> (it is the same server; there is no separate admin port)

Without `.env.local` the app has no database and stays on its loading screen.

### Database

`npm run db:setup` runs three steps in order and is safe to repeat:

1. `db:apply` — base schema and the admin auth user (needs `DATABASE_URL`, the Supabase **session pooler** string, or `SUPABASE_DB_PASSWORD`).
2. `db:sync` — applies every pending file in `supabase/migrations/` (tracked in `public.schema_migrations`) and reloads the API schema.
3. `db:seed-admin` — creates or updates the admin from `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`.

The payout-retry migration needs the `pg_cron` and `pg_net` extensions enabled on the project. Never edit an applied migration; add a new one.

## Scripts

| Script                                           | What it does                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| `npm run dev`                                    | Dev server on port 3000                                                    |
| `npm run build` / `npm start`                    | Production build / serve it on port 3000                                   |
| `npm run lint`                                   | ESLint                                                                     |
| `npm run typecheck`                              | `tsc --noEmit`                                                             |
| `npm test` / `npm run test:watch`                | Vitest (once / watch)                                                      |
| `npm run check:server-boundaries`                | Fails if server-only code reaches the client bundle (CI runs it)           |
| `npm run db:setup`                               | `db:apply` + `db:sync` + `db:seed-admin`                                   |
| `npm run db:apply` / `db:sync` / `db:seed-admin` | The three steps individually                                               |
| `npm run db:seed-mechanic`                       | Seed the mechanic taxonomy                                                 |
| `npm run db:seed-automedics`                     | Seed the Automedics shop catalog                                           |
| `npm run vehicles:catalog`                       | Rebuild the vehicle make/model catalog data                                |
| `npm run jobs:deadline-sweep`                    | Run the job deadline sweep once (see `docs/ISSUE_3_DEADLINE_SCHEDULER.md`) |
| `npm run backup:local` / `backup:local:watch`    | Local database snapshot once / every 24 h (`Local BackUp/README.md`)       |

## Before you open a pull request

```bash
npm run lint && npm run typecheck && npm test && npm run check:server-boundaries && npm run build
```

CI runs the same checks plus a fresh-Supabase migration test on pushes and pull requests to `main`, `staging` and `dev`.

## Project layout

- `src/app` — routes in groups `(onboarding)`, `(customer)`, `(artisan)`, `(shared)` (they do not change URLs); `admin/` and `api/` are top level. Page files stay thin and compose `src/components/<feature>/`.
- `src/components/ui` — shared UI (button, badge, avatar, sheets, `ona-*` form and screen pieces). Extend these before adding new ones.
- `src/lib` — domain logic, store, i18n, pricing and call-out engine (protected files are listed in `docs/RULES.md` §10).
- `supabase/migrations` — numbered SQL migrations. `scripts/` — operational scripts. `tools/flw-payout-proxy` — static-IP payout proxy.
- Source files stay at or under 300 lines: a big module is a thin file plus a folder of the same name ([`docs/CODEMAP.md`](docs/CODEMAP.md)).

## Conventions

- **Feedback:** success and error outcomes are toasts (`toastError` / `toastSuccess` from `@/lib/toast`); field validation hints stay inline.
- **Strings:** every user-visible string goes through `t("key")` in all 11 languages ([`src/lib/i18n/TRANSLATION.md`](src/lib/i18n/TRANSLATION.md)).
- **Back navigation** goes to the logical parent, never browser history.
- **Overlays** portal into `#ona-phone`.

## Deployment

Deploys are automatic through the GitHub → Vercel integration: pull requests get preview deployments and merging to the connected branch deploys it. There are no deploy scripts here. Set environment variables in Vercel (Project → Settings → Environment Variables); `.env.example` is the complete list. Scheduled jobs are defined in `vercel.json`. Details and go-live checklist: [`docs/VERCEL_DEPLOY.md`](docs/VERCEL_DEPLOY.md).

Never commit API keys. `.env.local` is gitignored; `.env.example` is the tracked template. Key handling and the payout proxy: [`docs/HANDOFF_KEYS.md`](docs/HANDOFF_KEYS.md).
