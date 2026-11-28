-- ============================================================================
-- Shop hardening: atomic pay / stock / refund / order creation
--
-- Fixes (see docs review "Shop Feature E2E Review"):
--  B3  payment confirmation was read-then-write -> one locked SQL function
--  B5  ona_shop_reserve used FOR UPDATE SKIP LOCKED -> spurious "out of stock"
--  B6  release/refund double-subtracted reservations and never restocked
--  M3  stock split across locations could not be reserved
--  H1  order + items were inserted non-transactionally
--  B2  adds a `refund_pending` order state for refunds the gateway has not
--      completed yet (never mark "refunded" before money moved)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Order status: add refund_pending (+ refund_error for ops visibility)
-- ---------------------------------------------------------------------------
do $$
declare
  c text;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.shop_orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%pending_payment%'
  loop
    execute format('alter table public.shop_orders drop constraint %I', c);
  end loop;

  alter table public.shop_orders
    add constraint shop_orders_status_check
    check (status in (
      'pending_payment',
      'paid',
      'fulfilling',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
      'partially_refunded',
      'refund_pending'
    ));
end $$;

alter table public.shop_orders
  add column if not exists refund_error text;

-- ---------------------------------------------------------------------------
-- 2. Per-order stock ledger: exactly which location/qty an order took, so a
--    refund puts back precisely that (and nothing else).
-- ---------------------------------------------------------------------------
create table if not exists public.shop_order_stock (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders (id) on delete cascade,
  variant_id uuid not null references public.shop_product_variants (id) on delete cascade,
  location_id uuid not null references public.shop_inventory_locations (id) on delete cascade,
  qty int not null check (qty > 0),
  state text not null default 'deducted'
    check (state in ('reserved', 'deducted', 'restocked', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_order_stock_order_idx
  on public.shop_order_stock (order_id);

alter table public.shop_order_stock enable row level security;

-- ---------------------------------------------------------------------------
-- 3. ona_shop_reserve: stop skipping locked rows (B5)
--    Kept for compatibility; the pay path now uses ona_shop_pay_order.
-- ---------------------------------------------------------------------------
create or replace function public.ona_shop_reserve(
  p_variant_id uuid,
  p_qty int,
  p_order_id uuid
) returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
  v_location uuid;
begin
  if p_qty <= 0 then
    return true;
  end if;

  select id, location_id into v_id, v_location
  from public.shop_inventory
  where variant_id = p_variant_id
    and (qty_on_hand - qty_reserved) >= p_qty
  order by qty_on_hand desc, id
  limit 1
  for update;

  if v_id is null then
    return false;
  end if;

  update public.shop_inventory
  set qty_reserved = qty_reserved + p_qty,
      updated_at = now()
  where id = v_id;

  insert into public.shop_inventory_transactions
    (variant_id, location_id, delta, reason, ref_type, ref_id)
  values
    (p_variant_id, v_location, -p_qty, 'reserve_on_pay', 'shop_order', p_order_id);

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. ona_shop_pay_order: ONE atomic step for "payment confirmed"
--    - locks the order row, so concurrent confirmations serialise (B3)
--    - idempotent: second call returns 'already_paid' and changes nothing
--    - checks ALL lines before touching anything, then deducts across
--      locations and records exactly what was taken (B6, M3)
--    - flips the order to paid and opens the delivery row in the same txn
--    Returns: paid | already_paid | insufficient_stock | invalid_status | not_found
-- ---------------------------------------------------------------------------
create or replace function public.ona_shop_pay_order(
  p_order_id uuid,
  p_payment_id uuid default null
) returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_order public.shop_orders%rowtype;
  r record;
  inv record;
  v_free int;
  v_remaining int;
  v_take int;
  v_zone_name text;
begin
  select * into v_order
  from public.shop_orders
  where id = p_order_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_order.status in ('paid', 'fulfilling', 'out_for_delivery', 'delivered') then
    return 'already_paid';
  end if;

  if v_order.status <> 'pending_payment' then
    return 'invalid_status';
  end if;

  -- Pass 1: verify every line can be satisfied (locks rows, mutates nothing).
  for r in
    select variant_id, sum(qty)::int as qty
    from public.shop_order_items
    where order_id = p_order_id
    group by variant_id
    order by variant_id
  loop
    select coalesce(sum(s.qty_on_hand - s.qty_reserved), 0)::int into v_free
    from (
      select qty_on_hand, qty_reserved
      from public.shop_inventory
      where variant_id = r.variant_id
      order by id
      for update
    ) s;

    if v_free < r.qty then
      return 'insufficient_stock';
    end if;
  end loop;

  -- Pass 2: deduct, largest free bucket first, recording each slice.
  for r in
    select variant_id, sum(qty)::int as qty
    from public.shop_order_items
    where order_id = p_order_id
    group by variant_id
    order by variant_id
  loop
    v_remaining := r.qty;
    for inv in
      select id, location_id, (qty_on_hand - qty_reserved) as free
      from public.shop_inventory
      where variant_id = r.variant_id
        and (qty_on_hand - qty_reserved) > 0
      order by (qty_on_hand - qty_reserved) desc, id
    loop
      exit when v_remaining <= 0;
      v_take := least(v_remaining, inv.free);

      update public.shop_inventory
      set qty_on_hand = qty_on_hand - v_take,
          updated_at = now()
      where id = inv.id;

      insert into public.shop_order_stock
        (order_id, variant_id, location_id, qty, state)
      values
        (p_order_id, r.variant_id, inv.location_id, v_take, 'deducted');

      insert into public.shop_inventory_transactions
        (variant_id, location_id, delta, reason, ref_type, ref_id)
      values
        (r.variant_id, inv.location_id, -v_take, 'sale', 'shop_order', p_order_id);

      v_remaining := v_remaining - v_take;
    end loop;
  end loop;

  update public.shop_orders
  set status = 'paid',
      paid_at = now(),
      refund_error = null,
      updated_at = now()
  where id = p_order_id;

  insert into public.shop_order_events (order_id, event_type, payload)
  values (
    p_order_id,
    'paid',
    jsonb_build_object('paymentId', p_payment_id, 'stock', 'deducted')
  );

  v_zone_name := coalesce(
    v_order.ship_to_snapshot ->> 'deliveryZoneName',
    v_order.delivery_zone_code,
    'Default'
  );

  insert into public.shop_deliveries
    (order_id, status, zone_code, zone_name, service_code, eta_minutes, events)
  values (
    p_order_id,
    'pending',
    v_order.delivery_zone_code,
    v_zone_name,
    v_order.delivery_service_code,
    v_order.delivery_eta_minutes,
    jsonb_build_array(jsonb_build_object(
      'at', now(),
      'status', 'pending',
      'note', 'Order paid, awaiting delivery assignment'
    ))
  )
  on conflict (order_id) do nothing;

  return 'paid';
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. ona_shop_restock_order: put back exactly what the order took (B6)
--    - idempotent (each ledger row flips state once)
--    - 'deducted' rows add back to qty_on_hand at the SAME location
--    - 'reserved' rows only drop the reservation
--    - legacy orders paid before this migration have no ledger rows: restock
--      their items once into the location with the most stock, and write a
--      marker row so a second call is a no-op.
--    Returns number of ledger rows restocked/released.
-- ---------------------------------------------------------------------------
create or replace function public.ona_shop_restock_order(p_order_id uuid)
returns int
language plpgsql
security definer set search_path = public
as $$
declare
  v_order public.shop_orders%rowtype;
  r record;
  v_loc uuid;
  done int := 0;
begin
  select * into v_order
  from public.shop_orders
  where id = p_order_id
  for update;

  if not found then
    return 0;
  end if;

  if not exists (
    select 1 from public.shop_order_stock where order_id = p_order_id
  ) then
    -- Legacy path: only orders that were really paid had stock taken.
    if v_order.paid_at is not null then
      for r in
        select variant_id, sum(qty)::int as qty
        from public.shop_order_items
        where order_id = p_order_id
        group by variant_id
      loop
        select location_id into v_loc
        from public.shop_inventory
        where variant_id = r.variant_id
        order by qty_on_hand desc, id
        limit 1
        for update;

        if v_loc is null then
          continue;
        end if;

        update public.shop_inventory
        set qty_on_hand = qty_on_hand + r.qty,
            updated_at = now()
        where variant_id = r.variant_id and location_id = v_loc;

        insert into public.shop_order_stock
          (order_id, variant_id, location_id, qty, state)
        values (p_order_id, r.variant_id, v_loc, r.qty, 'restocked');

        insert into public.shop_inventory_transactions
          (variant_id, location_id, delta, reason, ref_type, ref_id)
        values (r.variant_id, v_loc, r.qty, 'restock', 'shop_order', p_order_id);

        done := done + 1;
      end loop;
    end if;
    return done;
  end if;

  for r in
    select id, variant_id, location_id, qty, state
    from public.shop_order_stock
    where order_id = p_order_id
      and state in ('deducted', 'reserved')
    order by id
    for update
  loop
    if r.state = 'deducted' then
      update public.shop_inventory
      set qty_on_hand = qty_on_hand + r.qty,
          updated_at = now()
      where variant_id = r.variant_id and location_id = r.location_id;

      if not found then
        insert into public.shop_inventory (variant_id, location_id, qty_on_hand)
        values (r.variant_id, r.location_id, r.qty);
      end if;

      insert into public.shop_inventory_transactions
        (variant_id, location_id, delta, reason, ref_type, ref_id)
      values (r.variant_id, r.location_id, r.qty, 'restock', 'shop_order', p_order_id);

      update public.shop_order_stock
      set state = 'restocked', updated_at = now()
      where id = r.id;
    else
      update public.shop_inventory
      set qty_reserved = greatest(0, qty_reserved - r.qty),
          updated_at = now()
      where variant_id = r.variant_id and location_id = r.location_id;

      update public.shop_order_stock
      set state = 'released', updated_at = now()
      where id = r.id;
    end if;
    done := done + 1;
  end loop;

  return done;
end;
$$;

-- Old name kept so nothing that still calls it can corrupt other orders'
-- reservations: it now only undoes what THIS order took.
create or replace function public.ona_shop_release(p_order_id uuid)
returns int
language plpgsql
security definer set search_path = public
as $$
begin
  return public.ona_shop_restock_order(p_order_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. ona_shop_create_order: order + items in ONE transaction (H1)
--    Idempotent on checkout_token. Returns
--    { alreadyExists, id, orderNumber, totalMinor, status }
-- ---------------------------------------------------------------------------
create or replace function public.ona_shop_create_order(
  p_order jsonb,
  p_items jsonb
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
  v_row record;
begin
  insert into public.shop_orders (
    order_number, user_id, account_context, status, currency,
    subtotal_minor, delivery_fee_minor, discount_minor, total_minor,
    ship_to_address_id, ship_to_snapshot, notes, checkout_token,
    delivery_zone_code, delivery_service_code, delivery_eta_minutes
  ) values (
    p_order ->> 'order_number',
    (p_order ->> 'user_id')::uuid,
    coalesce(p_order ->> 'account_context', 'motorist'),
    'pending_payment',
    coalesce(p_order ->> 'currency', 'NGN'),
    (p_order ->> 'subtotal_minor')::bigint,
    (p_order ->> 'delivery_fee_minor')::bigint,
    0,
    (p_order ->> 'total_minor')::bigint,
    nullif(p_order ->> 'ship_to_address_id', '')::uuid,
    coalesce(p_order -> 'ship_to_snapshot', '{}'::jsonb),
    p_order ->> 'notes',
    p_order ->> 'checkout_token',
    p_order ->> 'delivery_zone_code',
    p_order ->> 'delivery_service_code',
    nullif(p_order ->> 'delivery_eta_minutes', '')::int
  )
  on conflict (checkout_token) where checkout_token is not null
  do nothing
  returning id into v_id;

  if v_id is null then
    select id, order_number, total_minor, status into v_row
    from public.shop_orders
    where checkout_token = p_order ->> 'checkout_token';
    return jsonb_build_object(
      'alreadyExists', true,
      'id', v_row.id,
      'orderNumber', v_row.order_number,
      'totalMinor', v_row.total_minor,
      'status', v_row.status
    );
  end if;

  insert into public.shop_order_items (
    order_id, variant_id, product_name, variant_title, sku,
    qty, unit_price_minor, line_total_minor
  )
  select
    v_id,
    (x ->> 'variant_id')::uuid,
    x ->> 'product_name',
    coalesce(x ->> 'variant_title', ''),
    coalesce(x ->> 'sku', ''),
    (x ->> 'qty')::int,
    (x ->> 'unit_price_minor')::bigint,
    (x ->> 'line_total_minor')::bigint
  from jsonb_array_elements(p_items) as x;

  insert into public.shop_order_events (order_id, event_type, payload, actor_id)
  values (
    v_id,
    'created',
    coalesce(p_order -> 'event_payload', '{}'::jsonb),
    (p_order ->> 'user_id')::uuid
  );

  return jsonb_build_object(
    'alreadyExists', false,
    'id', v_id,
    'orderNumber', p_order ->> 'order_number',
    'totalMinor', (p_order ->> 'total_minor')::bigint,
    'status', 'pending_payment'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Lock the RPCs to the service role only (security definer functions are
--    executable by PUBLIC by default, which PostgREST would expose).
-- ---------------------------------------------------------------------------
revoke all on function public.ona_shop_reserve(uuid, int, uuid) from public, anon, authenticated;
revoke all on function public.ona_shop_release(uuid) from public, anon, authenticated;
revoke all on function public.ona_shop_fulfill_deduct(uuid) from public, anon, authenticated;
revoke all on function public.ona_shop_pay_order(uuid, uuid) from public, anon, authenticated;
revoke all on function public.ona_shop_restock_order(uuid) from public, anon, authenticated;
revoke all on function public.ona_shop_create_order(jsonb, jsonb) from public, anon, authenticated;

grant execute on function public.ona_shop_reserve(uuid, int, uuid) to service_role;
grant execute on function public.ona_shop_release(uuid) to service_role;
grant execute on function public.ona_shop_fulfill_deduct(uuid) to service_role;
grant execute on function public.ona_shop_pay_order(uuid, uuid) to service_role;
grant execute on function public.ona_shop_restock_order(uuid) to service_role;
grant execute on function public.ona_shop_create_order(jsonb, jsonb) to service_role;
