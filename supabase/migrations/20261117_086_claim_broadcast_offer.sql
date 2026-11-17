begin;

-- Open-search broadcast: any eligible pro in range may claim an unclaimed job,
-- the first one wins. The claim is ONE transaction under a row lock, so two pros
-- tapping at the same instant cannot both succeed (the loser gets 'taken'). It
-- performs what dispatch_pairing_offer + open_pairing_request did for one pro:
-- queue row, assignment, and the active reservation / 144 s review window.
-- The unique index request_reservations_active_uniq is a second, independent
-- guarantee of a single claimant per request.
create or replace function public.claim_broadcast_offer(
  p_request_id uuid,
  p_pro_id uuid,
  p_pro_name text,
  p_pro_photo text,
  p_window_ms integer
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.service_requests%rowtype;
  v_now timestamptz := clock_timestamp();
  v_position integer;
  v_prior public.request_pairing_queue%rowtype;
  v_has_prior boolean;
  v_deadline timestamptz;
begin
  if p_pro_id is null or p_window_ms is null or p_window_ms < 1 or p_window_ms > 86400000 then
    raise exception 'Invalid broadcast claim';
  end if;

  select * into v_job from public.service_requests where id = p_request_id for update;
  if not found then return 'not_found'; end if;

  -- Replay by the pro who already holds it.
  if v_job.repair_pro_id = p_pro_id
      and v_job.pairing_stage in ('reserved', 'selected_review')
      and v_job.reservation_status = 'active' then
    return 'noop';
  end if;

  if v_job.status in ('cancelled', 'expired', 'completed', 'released')
      or v_job.pairing_stage is distinct from 'sequential_pairing'
      or v_job.reservation_status = 'confirmed'
      or v_job.assignment_status = 'assigned' then
    return 'closed';
  end if;
  if v_job.repair_pro_id is not null then return 'taken'; end if;

  -- A pro who declined / timed out / is deferred on this request cannot re-claim.
  select * into v_prior from public.request_pairing_queue
    where request_id = p_request_id and pro_id = p_pro_id for update;
  v_has_prior := found;
  if v_has_prior and v_prior.status not in ('pending', 'offered') then
    return 'excluded';
  end if;

  if exists (select 1 from public.request_reservations
             where request_id = p_request_id and status = 'active') then
    return 'taken';
  end if;

  v_position := coalesce(v_job.queue_position, 0) + 1;
  v_deadline := v_now + p_window_ms * interval '1 millisecond';

  if v_has_prior then
    update public.request_pairing_queue set
      position = v_position, source = 'broadcast', status = 'offered',
      offered_at = v_now, responded_at = null, result_note = null
      where id = v_prior.id;
  else
    insert into public.request_pairing_queue
      (request_id, pro_id, position, source, status, offered_at)
      values (p_request_id, p_pro_id, v_position, 'broadcast', 'offered', v_now);
  end if;

  insert into public.request_reservations (request_id, pro_id, stage, status, expires_at)
    values (p_request_id, p_pro_id, 'reserved', 'active', v_deadline);

  update public.service_requests set
    pairing_stage = 'reserved', flow_status = 'reserved', status = 'requested',
    pairing_deadline = v_deadline, queue_position = v_position,
    reservation_status = 'active', repair_pro_id = p_pro_id,
    repair_pro_name = p_pro_name,
    repair_pro_photo = coalesce(p_pro_photo, repair_pro_photo),
    updated_at = v_now,
    status_history = (case when jsonb_typeof(v_job.status_history) = 'array'
      then v_job.status_history else '[]'::jsonb end) || jsonb_build_array(
        jsonb_build_object('status', 'reserved', 'at', v_now, 'by', 'claim:' || p_pro_id::text))
    where id = p_request_id;
  if not found then raise exception 'Broadcast claim did not persist'; end if;
  return 'claimed';
end;
$$;

revoke all on function public.claim_broadcast_offer(uuid, uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_broadcast_offer(uuid, uuid, text, text, integer)
  to service_role;

commit;
