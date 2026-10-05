# Search, slow networks and accessibility

How Ona is made findable, usable on weak or metered connections, and usable with a keyboard or screen
reader. Read this before touching `public/sw.js`, the root layout, route layouts or colours.
The rules in short are in `docs/ANTI_REGRESSION.md` §13.

---

## 1. Search engines (SEO)

Only a few pages are public: the welcome screen `/`, the sign-in and sign-up forms, and the Privacy
Policy and Terms. Everything else is behind login, so it cannot be crawled and must stay out of search.

| What | Where |
|------|-------|
| Site name, description, URL, indexable and private path lists (single source) | `src/lib/site.ts` |
| `robots.txt`, `sitemap.xml`, web manifest | `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/manifest.ts` |
| Titles, Open Graph / Twitter cards, canonical, icons | root `src/app/layout.tsx` + `src/lib/seo/metadata.ts` |
| Organization + WebApplication JSON-LD | `src/lib/seo/structured-data.ts`, rendered in the root layout |
| `noindex` for private areas | passthrough `layout.tsx` in each route group and in `(shared)/jobs`, `messages`, `wallet`, `profile`, `settings`; `admin/layout.tsx` |
| No-JavaScript fallback with real content | `src/components/seo/no-script-notice.tsx` |

**Add a page that should be found:** add its path to `INDEXABLE_PATHS` in `lib/site.ts`, make it reachable
without login (`PUBLIC_PREFIXES` in `lib/routes.ts`; the auth gate must render it, see `isPublicContentRoute`
in `components/auth/auth-gate/boot-routes.ts`), give it a layout that exports `publicPageMetadata(...)`, and
make sure its text is in the server HTML (view-source it).

**Add a private page:** put it under a route group or a folder that already has a `noindex` layout. A test
(`src/lib/__tests__/seo.test.ts`) fails if any non-indexable page is not under one.

Notes:
- Lighthouse scores `/login` and `/shop` 63 for SEO on purpose: it correctly reports our `noindex`.
- A client-rendered, login-gated shell can score 100 for SEO and accessibility without being crawlable.
  The real checks are `view-source` (is the text in the HTML?) and the axe scan in §4.
- The legal pages are short summaries with a personal email contact. Get proper legal text before relying on them.
- Brand icons and the share image are cropped from the hero photo by `scripts/generate-brand-icons.mjs`
  (there is no logo mark yet). Swap the crop when one exists, then re-run the script and commit the output.

## 2. Slow, metered and offline networks

### Offline support: `public/sw.js`

| Request | Behaviour |
|---------|-----------|
| `/_next/static/*` (content-hashed build files) | cache-first |
| `/brand`, `/icons`, `/images`, `/media`, `/technicians`, `/shop/automedics`, `/_next/image` | stale-while-revalidate |
| Page navigations | network-first; if the network takes over 4 s and a previous copy exists, show it while the fresh one loads; if the network is down, show the last copy, else `/offline.html` |
| `/api/*`, `/admin`, other origins, Range requests, any non-GET | **never touched** |

Deliberate limits:
- **No API caching and no offline action queue.** Job, payment and verification actions must be explicit
  and must never be replayed later by a background worker.
- Pages with a query string (tokens, payment references, codes) and `/payments`, `/logout`,
  `/login/reset-password` are never stored.
- Push handlers live in the same file; keep them.

Operations:
- It registers in production only, after load and when idle (`components/pwa/service-worker-registrar.tsx`).
- **Kill switch:** open the app with `?no-sw`, or set `localStorage["ona-sw-disabled"] = "1"`. It unregisters
  the worker and clears `ona-*` caches.
- **Invalidate everything:** bump `SW_VERSION` in `public/sw.js`. Old caches are deleted on activate.
- `sw.js` and `offline.html` are served `no-store` (the catch-all rule in `next.config.ts`) so updates ship at once.
- `OfflineBanner` (in `PhoneShell`) announces offline and back-online through a polite live region.
- `lib/network` exposes connection quality (2G/3G/Data Saver) and `useNetworkStatus()` for adaptive behaviour.

### Keeping first load small

The root layout renders for every page, so anything it imports statically ships to everyone. Rules:
- The five `PhoneShell` overlays (onboarding sheet, OTP gate, accept-trip popup, incoming popup, release-pay
  gate) are loaded with `next/dynamic`. Keep new overlays lazy.
- Do not import `country-state-city`, `nigeria-state-lga-data`, the technician seed data or a wizard from a
  module the shell uses. Vehicle-only screens import `lib/vehicle-focus/vehicle-types` (not the barrel);
  the app shell imports `lib/data/user-location` (not `lib/data/technicians`).
- Pure helpers belong in their own small file, not next to a heavy component or data table.
- Check after any change: `next build`, then read `.next/diagnostics/route-bundle-stats.json`
  (`firstLoadUncompressedJsBytes` per route).

### Images and uploads
- Public images are cached for a day plus background refresh (`next.config.ts` header rules). New static
  folders under `public/` need their own rule, because the catch-all is `no-store`.
- Photos of IDs, skill documents and portfolio go through `compressDocumentFile` (`lib/image-compress.ts`):
  1600 px, JPEG 0.8, skipped under 250 KB, PDFs untouched, original kept if anything fails.
- Prefer AVIF/WebP for large art. The hero is served as AVIF, then WebP, then JPEG through `<picture>`.

## 3. Accessibility

Guest screens pass axe-core (WCAG 2.0/2.1 A and AA plus best practices) in light and dark themes.

- `PhoneShell` renders `<main id="main-content">` and a skip link ("Skip to main content") placed outside
  `#ona-phone` (an effect reads `#ona-phone`'s first child, so do not insert siblings before `<main>`).
- Keyboard focus: one global `:focus-visible` rule in `globals.css` (white inner ring, copper outer ring).
  It only appears for keyboard users.
- Every control needs a name: visible `<label htmlFor>` + `id`, or `aria-label` for icon buttons, search boxes
  and `role="switch"` toggles. `placeholder` is not a label.
- Colour on light chrome `#c8c9cd`: body/secondary text at least `#475569` (4.6:1); copper text uses `#8f2f0c`
  (4.9:1). `#FF6B35` text on light grey is 1.7:1 and fails. On dark: `text-white/70` for secondary text
  (and note dimmed rows apply `opacity-80` on top). Inline links need an underline.
- Dialogs: `role="dialog"`, `aria-modal`, a label, focus moved in on open, Escape closes (see
  `components/media/photo-lightbox.tsx`).
- The language and direction follow the chosen locale (`i18n-provider.tsx`); reduced-motion is respected in `globals.css`.

## 4. Checking your work

```bash
# Production build (the service worker and real bundle sizes only exist here)
npm run build && npm start

# Lighthouse: performance, best practices, SEO
npx lighthouse http://localhost:3000/login --only-categories=performance,seo --view
# Harsh network (weak phone, poor 2G/3G link)
npx lighthouse http://localhost:3000/login --throttling-method=simulate \
  --throttling.rttMs=450 --throttling.throughputKbps=400 --throttling.cpuSlowdownMultiplier=6

# Accessibility scan and offline end-to-end (real Chrome): see scripts/verify/README.md
cd scripts/verify && npm install && npm run axe && npm run offline
```

Use a **clean build** (`rm -rf .next`) when checking CSS: an incremental build once kept stale CSS.

## 5. Measured results

Lighthouse mobile, production build, `/login` unless noted. Standard = simulated slow 4G.

| | Before | Now |
|---|---:|---:|
| First-load JS, `/login` (uncompressed) | 1,861 KB | 1,010 KB |
| First-load JS, `/` | 2,471 KB | 1,648 KB |
| Median first-load JS over 77 pages | ~1,890 KB (estimate from the per-route savings) | 1,048 KB |
| Transferred, `/login` | 803 KB | 418 KB |
| LCP, `/login` (standard) | 6.1 s | 4.1 s |
| Performance score, `/login` | 78 | 86 |
| LCP, `/login` (harsh 2G-like) | 18.9 s | 15.4 s |
| Terms page: LCP / transferred / a11y | 6.1 s / 804 KB / 100 | 3.2 s / 412 KB / 100 |
| axe violations, 8 guest screens | landmarks, 25 contrast, link rule | 0 |

## 6. Still heavy: next levers

- About 310 KB (gzipped) of shared JavaScript remains on every page: React, the Supabase client and the app
  store. Deferring the Supabase client off the sign-in path, and lazy-loading Google Maps until a map is shown,
  are the next biggest wins for 2G.
- `/signup/pro` (2.1 MB) and `/artisan/onboarding` need the places data; they could load it on demand.
- Under harsh throttling `/login` is still about 15 s to interactive.
- Signed-in screens are only covered by `jsx-a11y` lint; test them by hand with a keyboard and a screen reader.
- Light-theme dimmed option rows (`opacity-80`) lower the contrast of their hint text; consider a non-opacity
  inactive style.
