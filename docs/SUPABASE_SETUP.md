# Ona — Supabase setup (new project)

## 1. Create project

1. Open https://supabase.com/dashboard
2. **New project**
   - Name: `ona`
   - Database password: generate and **save it**
   - Region: closest available (e.g. `eu-west-1` or `eu-central-1`)
3. Wait until the project is **Healthy**

## 2. Run SQL migration

1. Left menu → **SQL** → **New query**
2. Paste the full contents of:

   `supabase/migrations/20260714_001_init.sql`

3. **Run** (success = no errors)

## 3. Copy API keys

**Project Settings → API**

| Env var | Value |
|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (**secret**) |

Paste into `.env.local` (never commit).

## 4. Auth settings

**Authentication → Providers → Email**

- Enable Email
- Disable “Confirm email” for faster local testing (optional), **or** keep on and use seed script (`email_confirm: true`)

## 5. Set up the database and the Super Admin

Put your admin identity and the database connection in `.env.local` (names are in `.env.example`; never commit values):

```
ADMIN_SEED_EMAIL=you@example.com
ADMIN_SEED_PASSWORD=<a strong password you choose>
ADMIN_SEED_NAME=Your Name            # optional
DATABASE_URL=<Session pooler connection string, see below>
```

Then, **once per new Supabase project**:

```bash
npm run db:setup     # applies the schema, creates the admin Auth user + profile, syncs
```

`db:setup` creates the admin's Supabase Auth user first (the `profiles` table references Auth users), then the
admin profile. Re-running it is safe. To seed only the admin later: `npm run db:seed-admin`.

**Database connection:** in the Supabase dashboard open **Connect** and copy the **Session pooler** string
(`postgresql://postgres.<ref>:<db-password>@aws-*.pooler.supabase.com:5432/postgres`). The direct host
`db.<ref>.supabase.co` is IPv6-only and fails on networks without IPv6 (`ENOTFOUND`).

The admin signs in at `/admin/login` with `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD`. Role: `admin` (super admin).

## 6. Open the admin

```bash
npm run dev
open http://localhost:3000/admin/login
```

## 7. Vercel

| Project | Domain | Notes |
|---------|--------|--------|
| **`ona`** (primary) | https://ona-mi.vercel.app | Public app **and** `/admin` + all APIs |
| `ona-backend` (optional) | https://ona-backend.vercel.app | Same codebase; avoid if possible (extra bandwidth) |

Put the **same** Supabase + Maps env on `ona`, including:

- `SUPABASE_SERVICE_ROLE_KEY` (needed for server APIs and admin — not backend-only)
- `NEXT_PUBLIC_APP_URL=https://ona-mi.vercel.app`

If production shows **“This deployment is temporarily paused”**, the team is soft-blocked (Hobby fair use / Fast Origin Transfer) — see `docs/VERCEL_DEPLOY.md`. Local `npm run dev` / `npm run dev:admin` still works with `.env.local`.

You must run `npx vercel login` once before deploy.
