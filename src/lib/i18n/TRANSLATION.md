# Ona full-app translation system

## Goal

Every user-visible string in Ona goes through `t("key")` so all **11 languages** stay in sync.

| Code | Language |
|------|----------|
| `en` | English (master) |
| `yo` | Yoruba |
| `ig` | Igbo |
| `ha` | Hausa |
| `fr` | French |
| `pt` | Portuguese |
| `ar` | Arabic (RTL) |
| `es` | Spanish |
| `sw` | Swahili |
| `pcm` | Nigerian Pidgin |
| `zh` | Chinese (Simplified) |

Default: **English**. Preference is stored in `localStorage` (`ona-app-locale`).

## How the catalogs are laid out

Each language is a thin file (`catalog/<lang>.ts`) that spreads **section files** from a folder of the same name:

```
catalog/en.ts          # EN master: spreads the sections below
catalog/en/nav.ts      # export const EN_NAV = { "nav.home": "Home", ... } as const
catalog/fr.ts          # FR: spreads the FR_* sections in its own order
catalog/fr/nav.ts      # export const FR_NAV: Record<keyof typeof EN_NAV, string> = { ... }
```

Every language has the same nine sections: `nav`, `navShop`, `core`, `settings`, `home`, `tradeShop`, `jobs`, `account`, `shop`. Section boundaries are by key, so the same key lives in the same section file in every language and a translator can diff them side by side.

Locale sections are typed against the English section (`Record<keyof typeof EN_<SECTION>, string>`), so a **missing or extra key is a compile error** (`npm run typecheck`).

## How to add a string

1. Add the key to the right section in `catalog/en/<section>.ts` (English only, clear wording).
2. Add the **same key to the same section in every other language** (`catalog/yo/<section>.ts`, `ig`, `ha`, `fr`, `pt`, `ar`, `es`, `sw`, `pcm`, `zh`). Typecheck fails until all 11 have it.
3. Use it in UI: `const t = useT(); return t("my.key");`
4. Optional vars: `t("settings.themeSaved", { name: "Ada" })` → `{name}` placeholders.

## Rules for quality

- **One key = one meaning.** Do not reuse a key for different contexts.
- Keep **Nigeria-first product voice**: short, plain, respectful.
- **Do not translate** brand name **Ona**, product terms like **Repair Pro**, **Live**, **BVN** when they are product labels (unless a locale needs a short gloss).
- **Arabic** sets `dir="rtl"` automatically via `I18nProvider`.
- Prefer existing keys (`common.*`, `auth.*`) before inventing new ones.

## Check parity

```ts
import { assertCatalogParity } from "@/lib/i18n/catalog";
console.log(await assertCatalogParity()); // [] when perfect (async: it loads every locale first)
```

The compile-time typing above catches missing keys earlier; this runtime check also flags empty strings.

## Coverage today

- Settings hub (all 9 categories + Danger zone) + Appearance  
- Language, Notifications, Location pages  
- Bottom nav, radius label, ☰ menu (greetings, use-as, tap to close)  
- Auth role labels & signup hints (Customer / Repair Pro)  
- Search empty states (home + `/search`)  
- Catalog keys for Jobs, Messages, Profile, Verify, Signup, Dashboard, Menu  

**11 locales keep full key parity** with the English master (enforced by the types; `await assertCatalogParity()` → `[]`).

## Wiring more screens

Replace hard-coded English with `useT()`:

```tsx
import { useT } from "@/lib/i18n";

export function MyScreen() {
  const t = useT();
  return <h1>{t("jobs.title")}</h1>;
}
```

Add new UI copy to the matching `catalog/en/<section>.ts` first, then to the same section in every other language.
