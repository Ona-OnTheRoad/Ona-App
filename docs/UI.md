# Ona UI / UX — frozen visual system

**Status:** FROZEN. A human developer finishes flows inside this chrome. They do **not** restyle, “modernise”, or replace the phone shell.

If a pixel fight appears (incoming panel, radius, orange, light grey), `docs/ANTI_REGRESSION.md` wins.

---

## Frame (non-negotiable)

Consumer UI lives in **`#ona-phone`** — iPhone-class shell, not a fluid website.

| Token | Value |
|-------|--------|
| Width | `min(390px, 100vw - 1.5rem)` |
| Height | `min(844px, 100dvh - 1.5rem)` |
| Stage behind the phone | `#060d0a` |
| Font | Inter (`--font-ona-sans`) |

`html`/`body` are `overflow: hidden`. The document must not grow and “lap” outside the shell.

**Layout chain for every full-screen page:**

```
outer:  flex h-full min-h-0 flex-col overflow-hidden
header: shrink-0
body:   min-h-0 flex-1 overflow-y-auto overscroll-contain
footer: shrink-0
```

Overlays (call, X menu, incoming panel, sheets) **portal into `#ona-phone`**, never `document.body` in a way that escapes the frame.

Source: `src/app/globals.css`, `src/components/layout/phone-shell.tsx`, `src/components/layout/app-frame.tsx`.

---

## Colour

| Role | Value |
|------|--------|
| Accent (copper) | **`#FF6B35`** — `--brand`, `JOB_COPPER`, `COPPER`, `MESSAGE_ORANGE` |
| Accent pressed | `#E85A28` (`--brand-dark`) |
| Light chrome | **`#c8c9cd`** (nav, light page wash) |
| Dark chrome | **`#000000` / `#0a0a0a`** |
| Light ink | `#000000` / `#1c1c1e` |
| Dark ink | `#ffffff` |
| Success | `#34d399` |
| Danger | `#f87171` |

No new accent. No gradients on chrome. No gold/navy “premium” restyle. Menu icons are **solid copper fills**, not hollow Lucide strokes (`app-menu.tsx`).

Shop surfaces: **2% tint** of the page (already shipped). Do not add card outlines to incoming-request cards.

---

## Radius and type

| Token | Rule |
|-------|------|
| Panels / cards / buttons | **`6px`** (`--radius-panel: 0.375rem`). Large `rounded-xl/2xl/3xl` inside `#ona-phone` is forced back to this. |
| Avatars / true pills | Stay circles |
| Bottom nav labels | `10px`, medium |
| Primary CTA | `h-12`, `font-black`, solid `#FF6B35`, white text |

---

## Motion and theme

- X menu: one chrome transform, **80% / 20%** exclusive split (`--om-menu-split`). Light ≡ dark geometry.
- Double-tap **empty** shell space toggles light/dark (`phone-shell.tsx`). Do not attach that to controls or cards.
- Incoming pro panel: levels `full | middle | collapsed`; opens at **middle**; cards have **no border**; Q&A **2-at-a-time** in middle; full height `min(77%, 760px)`. See `ANTI_REGRESSION.md` §10.

---

## Navigation (UX contract)

| Rule | Detail |
|------|--------|
| Back | Logical parent via `navigateBack` — never `router.back()` / browser history |
| Customer tabs | Home, Requests, Profile — **no Jobs tab** |
| Pro tabs | Dashboard, Jobs, Requests, Profile |
| Chat | Only from an active job/request thread, not a global Messages tab |
| Call | `useInAppCall` / `openTelDialer` — never `window.location.href = "tel:"` |
| Shared paths | Shop, Express, Wallet, Settings — both roles |
| Wallet menu label | “Referral & Earn” today (`nav-schema.ts`) — rename only if product freezes wallet v1/v2 |

Source: `bottom-nav.tsx`, `app-menu.tsx`, `src/lib/navigation.ts`, `src/lib/nav-schema.ts`.

---

## What is done vs leftover (UX)

**Shipped (do not redesign)**

- Auth + role pick, motorist/pro signup, OTP
- Map home, 14 trade help-flows, orange progress bar
- Incoming request panel, negotiation, job shell, I’m Satisfied / release
- Pro dashboard (including Payment processing section)
- Shop browse / cart / checkout, Express flow
- Admin (separate from the phone shell — `/admin`, port 4500 locally)

**Finish inside the freeze (do not invent a new look)**

- Settings “coming soon”: Export personal data, Blocked users (`settings-ui.tsx`)
- Notification settings still local + “Server sync coming soon”
- Wallet page is Refer & Earn + amount-only cashout — not a new wallet visual language
- Availability / location settings: real UI exists; do not swap for a generic form kit
- Admin can stay denser than the phone app; do not force admin into `#ona-phone`

---

## Checklist before a UI PR

1. Still inside `#ona-phone`? Overlay portaled in?
2. `h-full min-h-0` chain intact?
3. Accent still `#FF6B35`, light wash still `#c8c9cd`, radius still 6px?
4. Back still logical parent?
5. Incoming panel / Call / Chat smoke in `ANTI_REGRESSION.md` §8–10 still pass?
6. Desktop **and** the 390×844 shell — the shell is the product.

If the change needs a new colour, a new radius, or a new nav IA, it is a **product decision**, not a polish ticket.

---

## Ona UI v2 (redesigned screens)

The design team is migrating screens one batch at a time. Redesigned screens use white surfaces and the coral accent through Tailwind tokens (`bg-ona-*`, `text-ona-*`, `rounded-ona-*`, defined in `globals.css` under `@theme` and scoped to a `.ona2` root so un-migrated screens keep the frozen look above). Shared pieces live in `src/components/ui/` (`ona-screen`, `ona-field`, `ona-otp-input`, `ona-segmented`, `ona-step-bars`, `ona-rule-list`, `ona-flow-header`, `Button` variants `ona*`, `Badge` `ona`/`matched`, `BottomSheet surface="ona"`). Extend these; do not add parallel copies.

Migrated: role picker, customer signup, login (phone + code), reset password, customer home sheet, help-flow vehicle/question/urgency steps, searching and labour-fee screens.

Rules that still apply: the layout chain, logical back navigation, `ona2` instead of `#ona-phone` overrides, white text only on `bg-ona-brand-btn` (the design coral `#E2654F` is ~3.3:1 with white and fails AA), coral text on white uses `text-ona-brand-ink`. Run `scripts/verify` axe in light and dark after changes.

---

## Feedback: toasts, theme and shadcn

**Toasts are the one channel for action feedback.** shadcn's Sonner is mounted once in `AppFrame` (`src/components/ui/sonner.tsx`, styled with the `ona-*` tokens, top-centre, inside `#ona-phone`). Use:

- `toastError(msg)` / `toastSuccess(msg)` / `toastInfo(msg)` from `@/lib/toast` (de-duplicated by text), or
- `useFeedbackToast(info, error)` from `@/lib/use-feedback-toast` when a component already keeps `error` / `info` strings in state.

Toast: a failed submit, "Saved", "Code sent", "Copied", flash messages. Keep **inline**: field-level validation hints next to their input, and persistent state the user must act on (payment pending, location error with Retry, offline, chat ended, empty/loading/list-error blocks, blocking dialogs). The server-driven notification toasts (`components/notifications`, new job / message / payment events) are a separate system and stay as they are.

**Theme:** first paint and first run follow the OS (`prefers-color-scheme`); a saved choice (toggle, per account or per device, key `ona-theme`) always wins. An inline script in `app/layout.tsx` applies it before paint; the store re-applies the same rule after hydration and follows OS changes until the user has chosen.

**shadcn:** the project uses the shadcn stack (Radix primitives, `class-variance-authority`, `clsx` + `tailwind-merge`, lucide, Sonner) and shadcn-style components in `src/components/ui/` (`button`, `badge`, `avatar`; Radix for tabs, slider, dialog, scroll-area, separator). There is no `components.json`; components are hand-maintained in the shadcn pattern, not generated by the CLI. Add new primitives in that pattern (extend an existing component with a variant before adding one).

---

## PWA install nudge

`src/lib/pwa/install.ts` (rules) + `use-pwa-install.ts` (signals) + `components/pwa/install-nudge.tsx` (banner above the dock, shown on tab-root screens while signed in).

- **Android / desktop Chrome:** the banner appears only when the browser has fired `beforeinstallprompt`; "Install" opens the native dialog.
- **iOS Safari:** no install API exists, so the banner opens Share → Add to Home Screen steps. iOS in-app browsers (Instagram, Facebook, …) cannot install and get no nudge.
- **Already installed:** never inside the installed app (`display-mode`, `navigator.standalone`, TWA referrer); the `appinstalled` event and `getInstalledRelatedApps()` (manifest lists the web app) record an install; Chromium only fires `beforeinstallprompt` when the app is *not* installed, which also clears a stale "installed" flag after an uninstall.
- **Frequency:** from the second visit, after 8 seconds on a screen; "Not now" snoozes 3 → 14 → 60 days.
- **Known limit:** iOS Safari cannot see that the app is installed (separate storage), so Safari visits by someone who installed may still show the nudge until they dismiss it; the installed app itself never does.
