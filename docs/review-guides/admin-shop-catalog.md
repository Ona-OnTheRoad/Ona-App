# Feature review guide: admin shop catalog create UI

## Goal

Admins with `shop_catalog` can add products to the shop from `/admin/shop` without calling the API by hand. Create/list/edit reuse the existing catalog APIs; no new backend surface.

Agreed plan (approved 2026-11-28):

1. Restore a **Catalog** tab on `/admin/shop` with list, search/filters, **+ New product** form, and an edit drawer (details, price, stock, image).
2. Keep an **Orders** tab with the current placeholder (orders console is out of scope for this fix).
3. Wire UI to existing `GET/POST /api/admin/shop/products` and product `[id]` price/stock/images routes; gate via existing `shop_catalog` permission on the API.
4. Update nav label and shop guide copy so catalog is visible.
5. Tests: API create/list validation + create-form readiness helper; confirm suite for touched paths.

## Expected change areas

- `src/app/admin/shop/page.tsx`
- `src/components/admin/shop/*` (new)
- `src/components/admin/admin-shell/nav-groups.ts`
- `src/components/admin/admin-guide-banner.tsx`
- `src/app/api/admin/shop/products/__tests__/route.test.ts` (new)
- `src/components/admin/shop/__tests__/*` (new)

Unchanged: `admin-catalog.ts`, product API handlers (except tests), shop buyer flows, fees/job escrow. No protected files (`docs/RULES.md` §10).

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON guide against the exact reviewed commit. Record concrete implementation/test evidence and live evidence separately. Never mark an unrun check passed.

## Boundaries and limitations

- Orders & delivery management UI is not restored here.
- Trade-attribute schema editing from the old hub is deferred; edit drawer covers meta, availability override, price, stock, image, soft/hard delete.
- Live create against hosted Supabase is a separate deployment check.

## Remaining work

- **Code:** Independent review; set `reviewedCommit` in the paired JSON.
- **External:** Live admin create with shop migrations + categories; confirm active products show in the buyer shop.
- Orders fulfillment console UI was deferred here and later restored under [admin-shop-hub](admin-shop-hub.md).

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` with the issue state and the same remaining code and external work. In the paired JSON guide, include `remainingWork: { "code": [], "external": [] }`, using explicit verified-none entries when appropriate.
