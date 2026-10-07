begin;

create table if not exists public.job_sweep_leases (
  scope text primary key check (scope in ('pairing', 'negotiation')),
  owner uuid not null,
  expires_at timestamptz not null
);
alter table public.job_sweep_leases enable row level security;
revoke all on public.job_sweep_leases from public, anon, authenticated;
grant select, insert, update, delete on public.job_sweep_leases to service_role;

-- 120s recovery after a crashed worker; HTTP sweep routes are capped at 60s.
create or replace function public.claim_job_sweep_lease(p_scope text, p_owner uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
declare claimed integer;
begin
  if p_scope not in ('pairing', 'negotiation') or p_scope is null or p_owner is null then
    raise exception 'Invalid sweep lease';
  end if;
  insert into public.job_sweep_leases(scope, owner, expires_at)
  values (p_scope, p_owner, clock_timestamp() + interval '120 seconds')
  on conflict (scope) do update
    set owner = excluded.owner, expires_at = excluded.expires_at
    where job_sweep_leases.expires_at <= clock_timestamp();
  get diagnostics claimed = row_count;
  return claimed = 1;
end;
$$;

create or replace function public.release_job_sweep_lease(p_scope text, p_owner uuid)
returns void language sql security definer set search_path = public, pg_temp
as $$
  delete from public.job_sweep_leases where scope = p_scope and owner = p_owner;
$$;

revoke all on function public.claim_job_sweep_lease(text, uuid) from public, anon, authenticated;
revoke all on function public.release_job_sweep_lease(text, uuid) from public, anon, authenticated;
grant execute on function public.claim_job_sweep_lease(text, uuid) to service_role;
grant execute on function public.release_job_sweep_lease(text, uuid) to service_role;

-- Timeout ownership and its destructive effects share one transaction. The next
-- candidate search runs afterward; a persisted deadline makes failed continuation retryable.
create or replace function public.timeout_pairing_request(
  p_request_id uuid, p_stage text, p_deadline timestamptz, p_pro_id uuid,
  p_updated_at timestamptz, p_retry_delay_ms integer
) returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
declare request public.service_requests%rowtype; stamp timestamptz;
begin
  if p_retry_delay_ms is null or p_retry_delay_ms < 1 or p_retry_delay_ms > 60000 then
    raise exception 'Invalid pairing retry delay';
  end if;
  select * into request from public.service_requests where id = p_request_id for update;
  stamp := clock_timestamp();
  if not found or p_stage is null or p_stage not in
      ('waiting_for_selected', 'selected_review', 'waiting_for_pro', 'reserved')
      or request.pairing_stage is distinct from p_stage
      or request.pairing_deadline is distinct from p_deadline
      or request.repair_pro_id is distinct from p_pro_id
      or request.updated_at is distinct from p_updated_at
      or coalesce(request.flow_status, '') not in
        ('waiting_for_selected', 'selected_review', 'waiting_for_pro', 'reserved')
      or request.reservation_status = 'confirmed'
      or p_deadline is null or p_deadline > stamp then
    return false;
  end if;

  update public.service_requests set
    pairing_stage = 'sequential_pairing', flow_status = 'sequential_pairing', status = 'requested',
    pairing_deadline = stamp + p_retry_delay_ms * interval '1 millisecond',
    reservation_status = 'none', repair_pro_id = null, repair_pro_name = null, updated_at = stamp,
    status_history = case when jsonb_typeof(request.status_history) = 'array' then request.status_history else '[]'::jsonb end || jsonb_build_array(
      jsonb_build_object('status', 'sequential_pairing', 'at', stamp, 'by', 'sweep:timeout'))
    where id = p_request_id;

  update public.request_pairing_queue set status = 'timed_out', responded_at = stamp,
    result_note = 'pairing deadline exceeded'
    where request_id = p_request_id and pro_id = p_pro_id and status = 'offered';
  update public.request_reservations set status = 'cancelled', released_at = stamp, released_by = 'timed_out'
    where request_id = p_request_id and pro_id = p_pro_id and status = 'active';

  -- Never void a different pro's lock or a quote of unknown ownership. Fee values stay intact.
  with voided as (
    update public.service_request_callouts set callout_status = 'CANCELLED', voided_at = stamp,
      void_reason = 'timed_out', lock_idempotency_key = null, updated_at = stamp
      where request_id = p_request_id and origin_pro_id = p_pro_id
        and callout_status not in ('CANCELLED', 'WAIVED')
      returning approved_route_distance_km, billable_distance_km, callout_fee
  ) insert into public.callout_fee_events(request_id, pro_id, event,
      approved_route_distance_km, billable_distance_km, callout_fee, payload)
    select p_request_id, p_pro_id, 'voided', approved_route_distance_km,
      billable_distance_km, callout_fee, jsonb_build_object('reason', 'timed_out') from voided;
  return true;
end;
$$;
revoke all on function public.timeout_pairing_request(uuid, text, timestamptz, uuid, timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.timeout_pairing_request(uuid, text, timestamptz, uuid, timestamptz, integer)
  to service_role;

-- Overdue-only ordered scans prevent future jobs occupying every bounded batch.
create index if not exists service_requests_negotiation_deadline_idx
  on public.service_requests(negotiate_ends_at, id) where flow_status = 'negotiating';

create index if not exists service_requests_unarmed_pairing_deadline_idx
  on public.service_requests(updated_at, id)
  where pairing_deadline is null and pairing_stage in
    ('waiting_for_selected', 'selected_review', 'sequential_pairing', 'waiting_for_pro', 'reserved');

commit;
