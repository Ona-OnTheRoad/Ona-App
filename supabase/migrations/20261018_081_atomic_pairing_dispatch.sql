begin;

-- An offer and its assignment are one transaction. Concurrent classification
-- may change the version, but cannot leave a queue-only offer behind.
create or replace function public.dispatch_pairing_offer(
  p_request_id uuid,
  p_expected_version bigint,
  p_expected_stage text,
  p_pro_id uuid,
  p_pro_name text,
  p_pro_photo text,
  p_remaining integer
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.service_requests%rowtype;
  v_now timestamptz := clock_timestamp();
  v_position integer;
  v_count integer;
begin
  select * into v_job from public.service_requests
    where id = p_request_id for update;
  if not found then return 'noop'; end if;

  -- A cancellation, assignment or already-contacted pro wins over a stale
  -- selector. Never move that job back into a new pairing offer.
  if v_job.pairing_stage is null
      or v_job.pairing_stage not in ('waiting_for_selected', 'selected_review', 'sequential_pairing', 'waiting_for_pro', 'reserved')
      or v_job.status in ('cancelled', 'expired', 'completed', 'released')
      or v_job.repair_pro_id is not null
      or v_job.reservation_status = 'confirmed'
      or v_job.assignment_status = 'assigned' then
    return 'noop';
  end if;
  if v_job.job_version is distinct from p_expected_version
      or v_job.pairing_stage is distinct from p_expected_stage then
    return 'conflict';
  end if;
  if p_pro_id is null or p_remaining is null or p_remaining < 0 then
    raise exception 'Invalid dispatch candidate';
  end if;
  v_position := coalesce(v_job.queue_position, 0) + 1;
  if v_position > 6 then return 'noop'; end if;

  insert into public.request_pairing_queue as q
    (request_id, pro_id, position, source, status, offered_at, responded_at, result_note)
  values (p_request_id, p_pro_id, v_position, 'pairing', 'offered', v_now, null, null)
  on conflict (request_id, pro_id) do update set
    position = excluded.position, source = excluded.source, status = excluded.status,
    offered_at = excluded.offered_at, responded_at = null, result_note = null
  where q.status = 'pending';
  get diagnostics v_count = row_count;
  if v_count = 0 then return 'conflict'; end if;

  update public.service_requests set
    pairing_stage = 'waiting_for_pro', flow_status = 'waiting_for_pro',
    status = 'requested', pairing_deadline = null,
    queue_position = v_position, remaining_candidates = p_remaining,
    reservation_status = 'none', repair_pro_id = p_pro_id,
    repair_pro_name = p_pro_name,
    repair_pro_photo = coalesce(p_pro_photo, repair_pro_photo),
    updated_at = v_now,
    status_history = (case when jsonb_typeof(v_job.status_history) = 'array'
      then v_job.status_history else '[]'::jsonb end) || jsonb_build_array(
        jsonb_build_object('status', 'waiting_for_pro', 'at', v_now, 'by', 'pairing:' || p_pro_id::text))
  where id = p_request_id;
  if not found then raise exception 'Dispatch assignment did not persist'; end if;
  return 'dispatched';
end;
$$;

revoke all on function public.dispatch_pairing_offer(uuid,bigint,text,uuid,text,text,integer)
  from public, anon, authenticated;
grant execute on function public.dispatch_pairing_offer(uuid,bigint,text,uuid,text,text,integer)
  to service_role;

commit;
