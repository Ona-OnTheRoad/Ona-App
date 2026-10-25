# Browser verification (accessibility + offline)

Unit tests cannot prove how the app behaves in a real browser, so these scripts drive real Chrome
against a running **production** build. They have their own `package.json` so their dependencies
(`puppeteer-core`, `axe-core`) never touch the app.

```bash
cd scripts/verify && npm install
```

Start the app first: `npm run build && npm start` (the service worker only runs in production).
Use `CHROME_PATH` if Chrome is not at the macOS default, and `BASE_URL` if the app is not on :3000.

| Command | What it checks |
|---------|----------------|
| `npm run axe` | WCAG 2.0/2.1 A + AA and best-practice rules (axe-core) on every screen reachable without an account. Pass a comma list and a theme to narrow it: `node axe.mjs /signup/pro light`. Exit code 1 if anything fails. |
| `npm run contrast -- /signup/pro` | The exact foreground/background colour pairs failing AA contrast, to pick a fix. |
| `npm run offline` | Service worker install, caching, offline banner, offline page, recovery, "APIs are never cached" and the `?no-sw` kill switch. To cut the connection for real, set `ONA_VERIFY_STOP_CMD` and `ONA_VERIFY_START_CMD` (see the header of `offline.mjs`). |

Only guest screens can be scanned; signed-in screens need a session. For those, rely on
`jsx-a11y` in lint and test by hand with the keyboard and a screen reader.

Lighthouse (performance, SEO, best practices) needs no setup:

```bash
npx lighthouse http://localhost:3000/login --only-categories=performance,seo --view
```

Note: Lighthouse scores a page by what the server sends. The app is client-rendered behind a login, so an
empty-looking shell can score 100 for SEO and accessibility; the axe scan above is the more honest check.

## Client-write lockdown migration

`client-write-lockdown.sql` tests migration 077 with real PostgreSQL grants,
RLS and triggers against a minimal schema. Run it **only in a disposable local
PostgreSQL cluster/database**, never against Supabase or an existing app database:

```bash
psql -X -v ON_ERROR_STOP=1 -h /path/to/disposable/socket -d postgres -f scripts/verify/client-write-lockdown.sql
```

The fixture creates roles/tables, reapplies the migration, checks protected
client writes before/after blanket regrants, and verifies own/other-Pro presence,
new trust columns, service-role writes and trusted SECURITY DEFINER operations.
It is not part of Vitest and does not reproduce the full Supabase schema.

`client-write-lockdown-hosted.sql` is the read-only counterpart for a hosted
database (Supabase SQL editor or `psql`). It only reads catalogs and checks that
`authenticated`/`anon` hold no protected INSERT/UPDATE/DELETE grants (including
column grants), the guard triggers exist and are enabled, the dropped policies
are still absent and the guard functions exist. Every row should be `ok = true`.
