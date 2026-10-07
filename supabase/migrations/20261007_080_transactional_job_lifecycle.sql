begin;

create table if not exists public.payment_webhook_inbox (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  dedupe_key text not null,
  event_type text not null,
  provider_ref text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'retry', 'processed', 'rejected', 'manual_review')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, dedupe_key)
);
create index if not exists payment_webhook_inbox_due_idx
  on public.payment_webhook_inbox (available_at, created_at)
  where status in ('pending', 'retry', 'processing');

create table if not exists public.payment_reconciliation_queue (
  payment_id uuid primary key references public.payments(id) on delete cascade,
  request_id uuid not null references public.service_requests(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'retry', 'completed', 'manual_review')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists payment_reconciliation_due_idx
  on public.payment_reconciliation_queue (available_at, created_at)
  where status in ('pending', 'retry', 'processing');

create table if not exists public.job_outbox (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  idempotency_key text not null unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'retry', 'delivered', 'manual_review')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);
create index if not exists job_outbox_due_idx
  on public.job_outbox (available_at, created_at)
  where status in ('pending', 'retry', 'processing');

alter table public.job_events
  add column if not exists source_outbox_id uuid references public.job_outbox(id) on delete set null;
create unique index if not exists job_events_source_outbox_unique
  on public.job_events (source_outbox_id) where source_outbox_id is not null;

alter table public.payment_webhook_inbox enable row level security;
alter table public.payment_webhook_inbox force row level security;
alter table public.payment_reconciliation_queue enable row level security;
alter table public.payment_reconciliation_queue force row level security;
alter table public.job_outbox enable row level security;
alter table public.job_outbox force row level security;
revoke all on public.payment_webhook_inbox, public.payment_reconciliation_queue, public.job_outbox from anon, authenticated;
grant select, insert, update, delete on public.payment_webhook_inbox, public.payment_reconciliation_queue, public.job_outbox to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.enqueue_payment_reconciliation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.provider_ref is not null and btrim(new.provider_ref) <> ''
    and new.status = 'pending' and new.escrow_status = 'pending_payment'
    and new.provider in ('flutterwave', 'paystack', 'mock') then
    insert into public.payment_reconciliation_queue(payment_id, request_id)
    values (new.id, new.request_id)
    on conflict (payment_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists payments_enqueue_reconciliation on public.payments;
create trigger payments_enqueue_reconciliation
after insert on public.payments
for each row execute function public.enqueue_payment_reconciliation();

insert into public.payment_reconciliation_queue(payment_id, request_id)
select p.id, p.request_id
from public.payments p
where p.provider_ref is not null and btrim(p.provider_ref) <> ''
  and p.status = 'pending' and p.escrow_status = 'pending_payment'
  and p.provider in ('flutterwave', 'paystack', 'mock')
on conflict (payment_id) do nothing;

create or replace function public.apply_confirmed_job_payment(
  p_payment_id uuid,
  p_request_id uuid,
  p_expected_job_version bigint,
  p_provider text,
  p_provider_ref text,
  p_verified_amount_kobo bigint,
  p_verified_currency text,
  p_paid_at timestamptz,
  p_provider_channel text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_job public.service_requests%rowtype;
  v_ts timestamptz := coalesce(p_paid_at, now());
  v_outbox_id uuid;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then return jsonb_build_object('outcome', 'not_found'); end if;
  select * into v_job from public.service_requests where id = p_request_id for update;
  if not found then return jsonb_build_object('outcome', 'job_not_found'); end if;

  if v_payment.request_id <> p_request_id
    or v_payment.provider <> p_provider
    or v_payment.provider_ref is distinct from p_provider_ref
    or v_payment.amount_kobo <> p_verified_amount_kobo
    or v_payment.currency <> p_verified_currency
    or v_payment.motorist_id <> v_job.motorist_id
    or v_payment.repair_pro_id is distinct from v_job.repair_pro_id
    or (v_job.payment_id is not null and v_job.payment_id <> p_payment_id::text)
    or v_job.payment_reference is distinct from p_provider_ref then
    return jsonb_build_object('outcome', 'association_mismatch');
  end if;
  if v_payment.escrow_status = 'refunded' or v_payment.refunded_at is not null
    or v_payment.status = 'refunded' then
    return jsonb_build_object('outcome', 'refunded');
  end if;
  if v_job.flow_status in ('paid_booked', 'en_route', 'arrived', 'in_progress', 'completed', 'satisfied', 'released') then
    if v_job.payment_reference = p_provider_ref then
      if v_payment.escrow_status in ('none', 'pending_payment') then
        update public.payments set status = 'paid', escrow_status = 'held',
          paid_at = coalesce(paid_at, v_ts), provider_channel = coalesce(p_provider_channel, provider_channel),
          updated_at = now()
        where id = p_payment_id;
      end if;
      update public.payment_reconciliation_queue set status = 'completed', completed_at = now(), locked_until = null,
        last_error_code = null, updated_at = now() where payment_id = p_payment_id;
      select * into v_payment from public.payments where id=p_payment_id;
      return jsonb_build_object('outcome', 'already_confirmed', 'job', to_jsonb(v_job), 'payment', to_jsonb(v_payment));
    end if;
    return jsonb_build_object('outcome', 'terminal_job');
  end if;
  if v_payment.escrow_status in ('released', 'release_pending', 'pending_settlement') then
    return jsonb_build_object('outcome', 'payment_terminal');
  end if;
  if v_job.flow_status <> 'agreed' then
    return jsonb_build_object('outcome', 'terminal_job');
  end if;
  if v_job.job_version <> p_expected_job_version then
    return jsonb_build_object('outcome', 'conflict');
  end if;
  if v_payment.escrow_status not in ('none', 'pending_payment', 'held') then
    return jsonb_build_object('outcome', 'payment_not_payable');
  end if;

  update public.payments set status = 'paid', escrow_status = 'held', paid_at = coalesce(paid_at, v_ts),
    provider_channel = coalesce(p_provider_channel, provider_channel), updated_at = now()
  where id = p_payment_id;
  update public.service_requests set
    flow_status = 'paid_booked', status = 'accepted', payment_id = p_payment_id::text,
    payment_reference = p_provider_ref, amount_minor = v_payment.amount_kobo,
    platform_fee_minor = v_payment.platform_fee_kobo, pro_payout_minor = v_payment.pro_payout_kobo,
    labour_agreed_kobo = v_payment.amount_kobo, escrow_status = 'held', paid_at = v_ts,
    updated_at = now(), negotiation_status = 'paid',
    status_history = coalesce(status_history, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('status', 'paid_booked', 'at', v_ts, 'by', 'system'))
  where id = p_request_id;

  insert into public.job_outbox(request_id, idempotency_key, event_type, payload)
  values (p_request_id, 'payment-booked:' || p_payment_id::text, 'payment_booked_notifications',
    jsonb_build_object('paymentId', p_payment_id, 'status', 'paid_booked', 'recipients',
      case when v_job.repair_pro_id is null then jsonb_build_array(
        jsonb_build_object('userId', v_job.motorist_id, 'groupKey', 'payment-booked-customer-' || p_payment_id::text,
          'title', 'Payment received', 'body', 'Your payment is confirmed and the job is booked.'))
      else jsonb_build_array(
      jsonb_build_object('userId', v_job.motorist_id, 'groupKey', 'payment-booked-customer-' || p_payment_id::text,
        'title', 'Payment received', 'body', 'Your payment is confirmed and the job is booked.'),
      jsonb_build_object('userId', v_job.repair_pro_id, 'groupKey', 'payment-booked-pro-' || p_payment_id::text,
        'title', 'Customer booked', 'body', 'Payment is confirmed for this job.')) end))
  on conflict (idempotency_key) do nothing returning id into v_outbox_id;

  if v_outbox_id is not null then
    insert into public.job_events(request_id, actor, event_type, payload, source_outbox_id)
    values (p_request_id, 'system', 'status', jsonb_build_object('status', 'paid_booked'), v_outbox_id)
    on conflict (source_outbox_id) where source_outbox_id is not null do nothing;
  end if;
  update public.payment_reconciliation_queue set status = 'completed', completed_at = now(), locked_until = null,
    last_error_code = null, updated_at = now() where payment_id = p_payment_id;

  select * into v_job from public.service_requests where id = p_request_id;
  select * into v_payment from public.payments where id = p_payment_id;
  return jsonb_build_object('outcome', 'confirmed', 'job', to_jsonb(v_job), 'payment', to_jsonb(v_payment));
end;
$$;

create or replace function public.claim_payment_webhook_inbox(p_limit integer default 10, p_lease_seconds integer default 60, p_event_id uuid default null)
returns setof public.payment_webhook_inbox
language sql
security definer
set search_path = public, pg_temp
as $$
  with picked as (
    select id from public.payment_webhook_inbox
    where ((status in ('pending', 'retry') and available_at <= now())
      or (status = 'processing' and locked_until < now()))
      and (p_event_id is null or id=p_event_id)
    order by available_at, created_at
    for update skip locked limit greatest(1, least(p_limit, 50))
  )
  update public.payment_webhook_inbox i set status='processing', attempts=i.attempts+1,
    locked_until=now()+make_interval(secs => greatest(10, least(p_lease_seconds, 300))), updated_at=now()
  from picked where i.id=picked.id returning i.*;
$$;

create or replace function public.finish_payment_webhook_inbox(
  p_id uuid, p_attempt integer, p_status text, p_error_code text default null, p_retry_seconds integer default 30
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_status text := p_status;
begin
  if p_status not in ('processed', 'retry', 'rejected', 'manual_review') then raise exception 'invalid inbox status'; end if;
  if p_status='retry' and (select attempts from public.payment_webhook_inbox where id=p_id) >= 12 then v_status := 'manual_review'; end if;
  update public.payment_webhook_inbox set status=v_status, locked_until=null,
    available_at=case when v_status='retry' then now()+make_interval(secs => greatest(5, least(p_retry_seconds, 3600))) else available_at end,
    last_error_code=left(p_error_code, 80), updated_at=now()
  where id=p_id and status='processing' and attempts=p_attempt;
  return v_status;
end;
$$;

create or replace function public.claim_payment_reconciliation(p_limit integer default 10, p_lease_seconds integer default 60)
returns setof public.payment_reconciliation_queue
language sql
security definer
set search_path = public, pg_temp
as $$
  with picked as (
    select payment_id from public.payment_reconciliation_queue
    where ((status in ('pending', 'retry') and available_at <= now())
      or (status='processing' and locked_until < now()))
    order by available_at, created_at
    for update skip locked limit greatest(1, least(p_limit, 50))
  )
  update public.payment_reconciliation_queue q set status='processing', attempts=q.attempts+1,
    locked_until=now()+make_interval(secs => greatest(10, least(p_lease_seconds, 300))), updated_at=now()
  from picked where q.payment_id=picked.payment_id returning q.*;
$$;

create or replace function public.finish_payment_reconciliation(
  p_payment_id uuid, p_attempt integer, p_status text, p_error_code text default null, p_retry_seconds integer default 60
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_status text := p_status;
begin
  if p_status not in ('completed', 'retry', 'manual_review') then raise exception 'invalid reconciliation status'; end if;
  if p_status='retry' and (select attempts from public.payment_reconciliation_queue where payment_id=p_payment_id) >= 20 then v_status := 'manual_review'; end if;
  update public.payment_reconciliation_queue set status=v_status, locked_until=null,
    completed_at=case when v_status='completed' then now() else completed_at end,
    available_at=case when v_status='retry' then now()+make_interval(secs => greatest(10, least(p_retry_seconds, 3600))) else available_at end,
    last_error_code=left(p_error_code, 80), updated_at=now()
  where payment_id=p_payment_id and status='processing' and attempts=p_attempt;
  return v_status;
end;
$$;

create or replace function public.drain_job_outbox(p_limit integer default 25)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_item public.job_outbox%rowtype; v_recipient jsonb; v_done integer := 0; v_failed integer := 0;
begin
  for v_item in select * from public.job_outbox
    where ((status in ('pending','retry') and available_at <= now())
      or (status='processing' and locked_until < now()))
    order by created_at for update skip locked limit greatest(1, least(p_limit, 100))
  loop
      update public.job_outbox set status='processing', attempts=attempts+1, locked_until=now()+interval '60 seconds', updated_at=now()
      where id=v_item.id;
    begin
      if v_item.event_type <> 'payment_booked_notifications' then raise exception 'unsupported_outbox_event'; end if;
      for v_recipient in select value from jsonb_array_elements(v_item.payload->'recipients') loop
        if not exists(select 1 from public.notifications n where n.user_id=(v_recipient->>'userId')::uuid
          and n.group_key=v_recipient->>'groupKey') then
          insert into public.notifications(user_id, category, priority, title, body, href, action_type, action_payload, group_key, job_id, job_status)
          values ((v_recipient->>'userId')::uuid, 'payments', 'normal', v_recipient->>'title', v_recipient->>'body',
            '/jobs/'||v_item.request_id::text, 'open_job', jsonb_build_object('jobId',v_item.request_id),
            v_recipient->>'groupKey', v_item.request_id, 'paid_booked');
        end if;
      end loop;
      update public.job_outbox set status='delivered', delivered_at=now(), locked_until=null, last_error_code=null, updated_at=now()
        where id=v_item.id;
      v_done := v_done+1;
    exception when others then
      update public.job_outbox set status=case when attempts >= 12 then 'manual_review' else 'retry' end,
        available_at=now()+make_interval(secs => least(3600, 15 * greatest(attempts,1))), locked_until=null,
        last_error_code='delivery_failed', updated_at=now() where id=v_item.id;
      v_failed := v_failed+1;
    end;
  end loop;
  return jsonb_build_object('delivered',v_done,'failed',v_failed);
end;
$$;

revoke all on function public.apply_confirmed_job_payment(uuid,uuid,bigint,text,text,bigint,text,timestamptz,text) from public, anon, authenticated;
revoke all on function public.claim_payment_webhook_inbox(integer,integer,uuid) from public, anon, authenticated;
revoke all on function public.finish_payment_webhook_inbox(uuid,integer,text,text,integer) from public, anon, authenticated;
revoke all on function public.claim_payment_reconciliation(integer,integer) from public, anon, authenticated;
revoke all on function public.finish_payment_reconciliation(uuid,integer,text,text,integer) from public, anon, authenticated;
revoke all on function public.drain_job_outbox(integer) from public, anon, authenticated;
grant execute on function public.apply_confirmed_job_payment(uuid,uuid,bigint,text,text,bigint,text,timestamptz,text) to service_role;
grant execute on function public.claim_payment_webhook_inbox(integer,integer,uuid) to service_role;
grant execute on function public.finish_payment_webhook_inbox(uuid,integer,text,text,integer) to service_role;
grant execute on function public.claim_payment_reconciliation(integer,integer) to service_role;
grant execute on function public.finish_payment_reconciliation(uuid,integer,text,text,integer) to service_role;
grant execute on function public.drain_job_outbox(integer) to service_role;

commit;
