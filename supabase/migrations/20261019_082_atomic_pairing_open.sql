begin;

-- Open uses the latest row under a lock, rather than a snapshot whose version
-- can change when the card surfaces or background classification completes.
create or replace function public.open_pairing_request(
  p_request_id uuid, p_pro_id uuid, p_idempotency_key text,
  p_window_ms integer, p_rearm_floor_ms integer
) returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_job public.service_requests%rowtype;
  v_reservation public.request_reservations%rowtype;
  v_has_reservation boolean;
  v_stage text;
  v_now timestamptz;
  v_deadline timestamptz;
begin
  if p_window_ms is null or p_window_ms < 1 or p_window_ms > 86400000
      or p_rearm_floor_ms is null or p_rearm_floor_ms < 0 or p_rearm_floor_ms >= p_window_ms then
    raise exception 'Invalid Open response window';
  end if;
  select * into v_job from public.service_requests where id = p_request_id for update;
  if not found then return 'not_found'; end if;
  if p_pro_id is null or v_job.repair_pro_id is distinct from p_pro_id then return 'forbidden'; end if;
  if v_job.flow_status = 'negotiating' and v_job.assignment_status = 'assigned'
      and v_job.reservation_status = 'confirmed' then
    return 'noop';
  end if;
  if v_job.status in ('cancelled','expired','completed','released')
      or v_job.pairing_stage is null
      or v_job.pairing_stage not in ('waiting_for_selected','waiting_for_pro','selected_review','reserved')
      or v_job.assignment_status = 'assigned' or v_job.reservation_status = 'confirmed' then
    return 'closed';
  end if;

  select * into v_reservation from public.request_reservations
    where request_id = p_request_id and status = 'active' for update;
  v_has_reservation := found;
  if v_has_reservation and v_reservation.pro_id is distinct from p_pro_id then
    return 'reservation_conflict';
  end if;
  if v_job.pairing_stage in ('selected_review','reserved') then
    -- Semantic replay: same pro already has the review. Never reset its timer.
    if v_has_reservation then return 'noop'; end if;
    return 'reservation_conflict';
  end if;

  v_now := clock_timestamp();
  v_stage := case when v_job.pairing_stage = 'waiting_for_selected' then 'selected_review' else 'reserved' end;
  v_deadline := v_job.pairing_deadline;
  if v_deadline is null or v_deadline - v_now < p_rearm_floor_ms * interval '1 millisecond' then
    v_deadline := v_now + p_window_ms * interval '1 millisecond';
  end if;

  if v_has_reservation then
    update public.request_reservations set stage=v_stage, expires_at=v_deadline
      where id=v_reservation.id;
  else
    insert into public.request_reservations(request_id,pro_id,stage,status,expires_at)
      values(p_request_id,p_pro_id,v_stage,'active',v_deadline);
  end if;
  update public.service_requests set
    pairing_stage=v_stage, flow_status=v_stage, status='requested',
    pairing_deadline=v_deadline, reservation_status='active', updated_at=v_now,
    idempotency_key=coalesce(p_idempotency_key,idempotency_key),
    status_history=(case when jsonb_typeof(v_job.status_history)='array'
      then v_job.status_history else '[]'::jsonb end) || jsonb_build_array(
      jsonb_build_object('status',v_stage,'at',v_now,'by','open:' || p_pro_id::text))
    where id=p_request_id;
  if not found then raise exception 'Open review state did not persist'; end if;
  return 'opened';
end;
$$;

revoke all on function public.open_pairing_request(uuid,uuid,text,integer,integer) from public, anon, authenticated;
grant execute on function public.open_pairing_request(uuid,uuid,text,integer,integer) to service_role;

commit;
