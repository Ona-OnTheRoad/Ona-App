-- 077: Lock down direct client (PostgREST) writes that bypass server rules.
--
-- The browser holds the public anon key, so anything `authenticated` may
-- write through RLS is writable by any signed-in user with a plain HTTP call.
-- Before this migration:
--   * profiles_update_own let a user set their own role = 'admin', which
--     passes is_admin() (RLS bypass everywhere) and the admin login check.
--   * requests_update_parties let either job party rewrite any column of
--     service_requests (status, price, repair_pro_id…), skipping the server
--     state machine, payment gate and arrival check.
--   * pro_upsert let a pro set their own verified / rating / visibility, or
--     insert a pro row (pro_roles_auto then grants the repair_pro role).
--   * motorist_profiles let a motorist self-approve identity.
--
-- After: all writes to these tables go through /api (service_role), except a
-- pro's own presence heartbeat columns (Go Live fallback in app-api.ts).
-- Grants are revoked AND guard triggers are added, so a future blanket
-- `grant … to authenticated` (as 031 did) cannot silently reopen the hole.
--
-- service_role, postgres, security-definer functions and pg_cron are
-- unaffected: the guard only fires when current_user is an end-user role.

begin;

-- ── Helpers ─────────────────────────────────────────────────────────────────

create or replace function public.ona_is_client_role()
returns boolean
language sql
stable
as $$
  select current_user in ('authenticated', 'anon');
$$;

-- Rejects every client-role write on the table it is attached to.
create or replace function public.ona_block_client_write()
returns trigger
language plpgsql
as $$
begin
  if public.ona_is_client_role() then
    raise exception 'Direct writes to % are not allowed; use the Ona API', tg_table_name
      using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

-- repair_pro_profiles: clients may only change presence/heartbeat columns.
-- location_geo is derived by trg_repair_pro_profiles_location_geo
-- (fires earlier: triggers run in name order), updated_at by set_updated_at.
create or replace function public.ona_guard_pro_profile_client_write()
returns trigger
language plpgsql
as $$
declare
  client_writable constant text[] := array[
    'is_online', 'lat', 'lng', 'location_updated_at', 'location_geo', 'updated_at'
  ];
begin
  if not public.ona_is_client_role() then
    return coalesce(new, old);
  end if;
  if tg_op <> 'UPDATE' then
    raise exception 'Direct % on repair_pro_profiles is not allowed; use the Ona API', tg_op
      using errcode = '42501';
  end if;
  if (to_jsonb(new) - client_writable) is distinct from (to_jsonb(old) - client_writable) then
    raise exception 'Only presence fields can be changed directly; use the Ona API'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- ── profiles: no client writes (role / admin_role / is_active escalation) ──

revoke insert, update, delete on table public.profiles from authenticated, anon;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_admin_insert on public.profiles;

drop trigger if exists trg_zz_ona_block_client_write on public.profiles;
create trigger trg_zz_ona_block_client_write
  before insert or update or delete on public.profiles
  for each row execute function public.ona_block_client_write();

-- ── service_requests: mutations only via /api/jobs/* ───────────────────────

revoke insert, update, delete on table public.service_requests from authenticated, anon;
drop policy if exists requests_update_parties on public.service_requests;
drop policy if exists requests_insert_motorist on public.service_requests;

drop trigger if exists trg_zz_ona_block_client_write on public.service_requests;
create trigger trg_zz_ona_block_client_write
  before insert or update or delete on public.service_requests
  for each row execute function public.ona_block_client_write();

-- ── job history tables: server-written audit trail ─────────────────────────

revoke insert, update, delete on table public.job_status_events from authenticated, anon;
drop policy if exists job_events_insert on public.job_status_events;

drop trigger if exists trg_zz_ona_block_client_write on public.job_status_events;
create trigger trg_zz_ona_block_client_write
  before insert or update or delete on public.job_status_events
  for each row execute function public.ona_block_client_write();

revoke insert, update, delete on table public.job_events from authenticated, anon;

drop trigger if exists trg_zz_ona_block_client_write on public.job_events;
create trigger trg_zz_ona_block_client_write
  before insert or update or delete on public.job_events
  for each row execute function public.ona_block_client_write();

-- ── motorist_profiles: identity fields are server/Care-owned ───────────────

revoke insert, update, delete on table public.motorist_profiles from authenticated, anon;

drop trigger if exists trg_zz_ona_block_client_write on public.motorist_profiles;
create trigger trg_zz_ona_block_client_write
  before insert or update or delete on public.motorist_profiles
  for each row execute function public.ona_block_client_write();

-- ── repair_pro_profiles: presence heartbeat only ───────────────────────────

revoke insert, delete on table public.repair_pro_profiles from authenticated, anon;

drop trigger if exists trg_zz_ona_guard_client_write on public.repair_pro_profiles;
create trigger trg_zz_ona_guard_client_write
  before insert or update or delete on public.repair_pro_profiles
  for each row execute function public.ona_guard_pro_profile_client_write();

commit;
