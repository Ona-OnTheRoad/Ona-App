# Feature review guide: admin shop hub restore (catalog + orders + couriers)

## Goal

Restore the full admin Shop hub so ops can manage catalog, orders/delivery, and courier providers from `/admin/shop` without calling APIs by hand.

Agreed plan (approved 2026-11-28):

1. Keep the Catalog tab (create/list/edit) already restored.
2. Replace the Orders placeholder with the `origin/dev` orders console (list, search, status filter, refund-attention banner, detail drawer).
3. Port order API/lib improvements needed for that console (`listAdminOrders`, order detail GET, delivery transitions, finance-gated refund).
4. Restore Courier registry on the Orders tab and wire datalist suggestions into the delivery form.
5. Tests for list/detail/actions, deliveries transitions, couriers, and existing catalog create coverage.
6. Out of scope: new tabs for analytics, product-requests, category CRUD, data-sources (APIs only; never had hub UI). Trade-attribute profiling in the product drawer remains deferred.

## Expected change areas

- `src/app/admin/shop/page.tsx`
- `src/components/admin/shop/*` (orders panel, drawer, table, courier registry, hooks)
- `src/lib/server/shop/admin-orders.ts`, `admin-deliveries.ts`, `shop-events.ts`, `orders.ts` (refundable statuses / cancel actor)
- `src/lib/shop/delivery-transitions.ts`
- `src/app/api/admin/shop/orders/*`, `deliveries/route.ts`
- Guide/nav copy; review guide + BACKEND_FIXES_STATUS

## Reviewer procedure

Inspect each acceptance criterion in the paired JSON guide against the exact reviewed commit. Record code/test evidence and live evidence separately. Never mark an unrun check passed.

## Boundaries and limitations

- Analytics / product-requests / data-sources / category CRUD UIs are not added.
- Full gateway refund-engine rewrite from `origin/dev` is not ported wholesale; refundable statuses and finance permission gate are wired to this branch’s `refundShopOrder`.
- Live hosted create/order/delivery checks are external.

## Remaining work

Filled in the paired JSON at handoff.

## Closeout

Update `docs/BACKEND_FIXES_STATUS.md` and the paired JSON `remainingWork`.
