# Design migration: what is not done, and why

Tracks every place the Ona UI v2 redesign (white surfaces, coral accent, bottom dock) differs from the Figma
designs or was left incomplete. Update it when an item is closed. See `docs/UI.md` ("Ona UI v2") for the system.

Legend: **Backend** = needs data or an API the app does not have. **Code** = the real behaviour or structure
differs from the mock-up and changing it would change functionality. **Protected** = file listed in
`docs/RULES.md` §10. **Decision** = needs a product or design call. **Verify** = built but not checked.

## 1. Auth and signup

| Item | Type | Detail |
| --- | --- | --- |
| Signup phone OTP ("Verify your number") | Backend | Built at `/signup/verify` but disabled and skippable ("Skip for now"). `/api/auth/otp/send` only accepts registered phones, so no number can be verified before an account exists, and SMS billing is not live. Enabling needs a pre-account OTP endpoint. Phone is verified later in `/verify`. |
| Signup order | Decision | New flow: `/signup` (shared Create account details, saved to a sessionStorage draft, never a password) -> `/signup/verify` (skippable) -> `/login/role` -> Customer (password, area, vehicles) or Repair Pro (existing wizard, details prefilled and editable). `/login/role` without a draft redirects to `/signup`, so old guest links keep working. |
| Password policy | Done | The design's 5 rules (10+ characters, number, lowercase, uppercase, symbol) are now the single policy in `src/lib/signup-validation.ts`, used by signup (customer and pro), reset password, Settings/Profile change password and enforced server-side on new signups and `/api/auth/update-password`. Dual-role attach keeps the existing password. Existing users with older, weaker passwords can still log in. |
| Forgot password by OTP | Backend | Design shows an SMS-code reset. The backend sends an email recovery link (`/api/auth/forgot-password`); the reset page opens from that link. |
| Password login by phone | Decision | Phone login is SMS code only. Email login now supports email + password (added after the first pass). |
| Referral "Apply code" | Backend | Cosmetic: the code is sent as before with no validation endpoint. |
| City / Area selects | Backend | Design shows dropdowns; there is no city/area list in the code, so they are text inputs. |
| Signup footer line ("Protected by Ona escrow… Flutterwave") | Code | Not built. |
| Create-account button needs a vehicle | Decision | "Create my account" is disabled until a vehicle is added; "Skip vehicle. Finish" covers the empty case. Before, the button worked with no vehicle. |
| Role cards illustrations | Design | Cards use a coral icon tile; the design has illustrations (assets not provided). Labels stay "Customer" / "Repair Pro" (existing i18n), not "Car Owner". |
| Login role default | Code | Design shows Customer pre-selected; the app requires an explicit pick (existing rule). |

## 2. Home and navigation

| Item | Type | Detail |
| --- | --- | --- |
| Dock tabs differ between mock-ups | Decision | Mocks show Home/History/Shop/Profile and Home/History/Wallet/Profile. Built: Home, Shop, Wallet, Profile + More (History, Settings, Express, Notifications). Repair Pro: Dashboard, Jobs, Wallet, Profile + More (Shop, Payments, Settings, Notifications). |
| Dock More sheet portal | Package | `react-floating-dock` portals its sheet to `document.body`. `usePhoneRect` + CSS in `globals.css` pin it to the phone shell. A `container` prop in the package would remove the workaround. |
| Dock close handle | Package | The dock has no programmatic close; extra actions close the sheet by dispatching Escape (`closeDockSheet`). |
| Dock hidden on sub-pages and trade flows | Decision | Shown only on tab roots (`dockVisibleOn`) and hidden while a trade flow is open. |
| Ona. wordmark / OnTheRoad flash on home | Design | Dropped (design home has no header bar). |
| "Add your bank for refunds" panel on customer home | Decision | Removed from `HomeScreen` because the design has no floating panel. `BankForcePanel` is still used on the Repair Pro dashboard. Customers add a bank via Settings → Payments → Bank (`/settings/payments/bank`, `/settings/bank-setup`); decide if a softer prompt (profile banner or after first request) is wanted. |
| Trade-search field on home | Code | New UI: client-side filter of tiles by label, no API. |
| Trade grid is 3 columns on home, 4 in Shop | Design | Follows each mock-up. Shop is the extra 15th tile on home. |

## 3. Request flow (vehicle, questions, urgency)

| Item | Type | Detail |
| --- | --- | --- |
| Progress bar segment count | Decision | Bars come from `config.progressDefaultTotal` (10 to 13 per trade). Mock-ups show 2 to 7. Capping/recomputing in `flow-progress-bar.tsx` would match but changes progress maths. |
| Question subtitles | Code | Generic line used because configs carry no per-question subtitle. |
| Route-confirm subtitle ("dangerous location…") | Code | Design text is specific to one question; a generic line is used. |
| Urgency card values | Code | Display-only estimate from `calculateCalloutFee` using the nearest pro; hidden when no pro in range and for vulcanizer/battery (never charge call-out). Design numbers were placeholders. |
| Urgency auto-advance | Code | Picking a radio no longer auto-advances (the card must update first). |
| "A." prefixes on options | Design | Dropped. |
| Generator/solar machine pickers, voice recorder, address autocomplete | Verify | Pickers are tokenised; voice recorder (`components/jobs`) and address autocomplete (`components/map`) keep their old look. |

## 4. Searching, labour fee, payment, tracking, chat

| Item | Type | Detail |
| --- | --- | --- |
| Labour-offer slider | Code | App uses a numeric counter-offer input (validated by `validateOfferAmount`). No slider mechanism exists; the 50% maximum is shown as text only. |
| Pro rating and "230+ bookings" | Backend | The job has no pro rating or booking-count data; the pro card shows the service label. |
| Radar avatar dots | Backend | One dot shows the pro photo when known. No other pros' data on the screen. |
| Timer chip format | Code | Shows seconds ("66s") per the existing short-window convention, not "2:24". |
| "Simulate match found" button | Design | Prototype-only, intentionally not built. |
| Cycling status messages on search | Design | Removed in the new layout. |
| Checkout "Payment gateway" label | Backend | Shows the real method ("Bank transfer"); the design's gateway text is a placeholder. |
| Checkout "Cancel" chip vs back arrow | Code | Kept the chip because it opens the cancel chooser. |
| Tracking: no ETA/rating on pro card, "Cancel booking" wording | Backend/Code | Rating missing; label stays "Cancel full refund" so the fee rule is visible. Map stats bar unchanged. |
| Chat: no ETA bar, no "Delivered" status | Backend | Chat page has no job ETA and messages carry no delivery state. |
| Release flow is two steps | Code | Real flow reviews after release: completed stage (pro card, total, release) then released stage (stars, review). The design's single "Everything sorted?" screen is split. |
| Release CTA is the swipe slider | Protected | `motorist-release-pay-gate/swipe-to-release.tsx` has hardcoded `#FF6B35` and slate text; needs a coral-button variant to match. |
| Customer release breakdown | Code | Customers see only the total (RULES §3); the 87.5 / 5 / 7.5 rows stay Repair Pro only. |
| Dark call-out card details | Protected | `callout-fee-lines.tsx` is styled only through props from callers (its Total divider uses an `isLight` default, may look off in dark). |
| "Book another service" / "View receipt" | Code | Reuse the existing "Done · Home" handler (to `/dashboard`) and the "Receipt" toggle. |
| Reroute overlay on the negotiation screen | Verify | `RerouteAlertOverlay` keeps old styling. |
| Pro-side tracking and swipe-sheet states beyond en route | Verify | Not checked visually. |

## 5. Notifications and history

| Item | Type | Detail |
| --- | --- | --- |
| Notification empty-state illustration | Design | Bell-icon placeholder (asset not provided). |
| Notification filter chips | Code | All / Service / Comment / Wallet plus the existing System chip, mapped to existing categories client-side. |
| History: default "Completed" filter | Code | Design opens with Completed selected. The page defaults to all jobs with toggle-off chips; pre-selecting would hide cancelled/expired jobs. |
| History: "Upcoming" badge and schedule line | Backend | History holds only past statuses; no schedule field is shown. |
| History: location line | Backend/Privacy | `locationLabel` is the customer's job pin; showing it could expose addresses to pros. |
| History: refunded/expired badge colour | Design | Uses the neutral badge, there is no amber variant. |
| History: empty-state illustration | Design | `ReceiptText` icon placeholder. |
| Pro past-job list (`pro-past-job-row`) | Verify | Not restyled. |

## 6. Shop

| Item | Type | Detail |
| --- | --- | --- |
| Trade page, product page, checkout, checkout callback | Not done | `/shop/c/[trade]`, `/shop/p/[slug]`, `checkout/*` keep the old styling (not in the mock-ups). |
| `shop-facet-bar`, `shop-availability-chips` | Not done | Old styling. |
| Order detail mock data ("undefined" in payment line) | Backend | The design shows a broken string; the real page renders the available fields. |
| Order status polling | Backend | These screens had none and none was added. |
| Shop-card strings ("Shop is almost ready") | Code | Unchanged. |

## 7. Cross-cutting

| Item | Type | Detail |
| --- | --- | --- |
| Coral button colour | Decision | Design coral `#E2654F` is ~3.3:1 with white text (fails WCAG AA, flagged by axe). Filled buttons use `#CB4A34` (`bg-ona-brand-btn`); `#E2654F` is kept for accents. One token to change if the designers prefer. |
| i18n | Code | New strings are English only (home search, "Find trusted help near you.", "No match", login method labels, etc.). Existing keys are reused where they exist. |
| Dark theme | Decision | The design is light only. Dark values for the `ona-*` tokens are derived (brownish dark like the existing dark theme). |
| Browser/visual verification | Verify | Only login, role, signup, reset, email login and the dock More sheet (public pages) were checked in a browser, in light and dark with axe. Signed-in screens (home, request flow, payments, tracking, chat, release, notifications, history, shop) were verified by types, lint, unit tests and build only. |
| `scripts/verify` axe/contrast | Verify | Axe was run on public routes only (needs an account for the rest). |
| Repair Pro screens | Not done | Pro dashboard, incoming request panel and pro flows were not in the designs; they share restyled components but were not reviewed. |
| `searching-map.tsx`, `flat-select.tsx`, old menu drawer | Cleanup | Deleted as dead code. |
