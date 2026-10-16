-- Run only in a disposable, empty local database, never against Supabase.
-- psql -X -v ON_ERROR_STOP=1 -d <empty-test-db> -f scripts/verify/client-write-lockdown.sql
-- Minimal fixture exercises actual grants, RLS and trigger execution. It does
-- not reproduce the entire application schema or prove hosted deployment.
\set ON_ERROR_STOP on

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role bypassrls;
  end if;
end;
$$;
grant usage on schema public to anon, authenticated, service_role;

create table public.profiles (id integer primary key, role text);
create table public.service_requests (id integer primary key, status text);
create table public.job_status_events (id integer primary key, status text);
create table public.job_events (id integer primary key, status text);
create table public.motorist_profiles (id integer primary key, verified boolean);
create table public.repair_pro_profiles (
  id integer primary key, verified boolean, rating_avg numeric,
  is_online boolean, lat numeric, lng numeric,
  location_updated_at timestamptz, location_geo text, updated_at timestamptz
);

do $$
declare t text;
begin
  foreach t in array array['profiles', 'service_requests', 'job_status_events',
    'job_events', 'motorist_profiles', 'repair_pro_profiles'] loop
    execute format('grant all on public.%I to anon, authenticated, service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy fixture_owner on public.%I for all
      using (id = 1) with check (id = 1)', t);
    execute format('insert into public.%I (id) values (1), (2)', t);
  end loop;
end;
$$;

\ir ../../supabase/migrations/20261004_077_lock_client_writes.sql
-- Reapplying must also succeed.
\ir ../../supabase/migrations/20261004_077_lock_client_writes.sql

create function public.expect_denied(statement text) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege then
    return;
  end;
  raise exception 'Expected insufficient_privilege: %', statement;
end;
$$;

-- Existing broad RLS policies must not defeat revoked grants.
set role authenticated;
do $$
declare t text;
begin
  foreach t in array array['profiles', 'service_requests', 'job_status_events',
    'job_events', 'motorist_profiles'] loop
    perform public.expect_denied(format('insert into public.%I (id) values (3)', t));
    perform public.expect_denied(format('update public.%I set id = id where id = 1', t));
    perform public.expect_denied(format('delete from public.%I where id = 1', t));
  end loop;
  perform public.expect_denied('insert into public.repair_pro_profiles (id) values (3)');
  perform public.expect_denied('delete from public.repair_pro_profiles where id = 1');
  perform public.expect_denied('update public.repair_pro_profiles set verified = true where id = 1');
  perform public.expect_denied('update public.repair_pro_profiles set rating_avg = 5 where id = 1');
end;
$$;

update public.repair_pro_profiles set is_online = true, lat = 6.5, lng = 3.4,
  location_updated_at = now(), updated_at = now() where id = 1;
do $$
begin
  if not exists (select 1 from public.repair_pro_profiles where id = 1 and is_online) then
    raise exception 'Own presence update failed';
  end if;
end;
$$;
-- RLS must still prevent modifying another Pro's presence.
update public.repair_pro_profiles set is_online = true where id = 2;
reset role;
do $$
begin
  if exists (select 1 from public.repair_pro_profiles where id = 2 and is_online) then
    raise exception 'Other Pro presence changed';
  end if;
end;
$$;

-- A later blanket grant must not reopen the protected write paths.
grant all on all tables in schema public to anon, authenticated;
alter table public.repair_pro_profiles add column future_trust_field text;
set role authenticated;
do $$
declare t text;
begin
  foreach t in array array['profiles', 'service_requests', 'job_status_events',
    'job_events', 'motorist_profiles'] loop
    perform public.expect_denied(format('insert into public.%I (id) values (1)', t));
    perform public.expect_denied(format('update public.%I set id = id where id = 1', t));
    perform public.expect_denied(format('delete from public.%I where id = 1', t));
  end loop;
  perform public.expect_denied('insert into public.repair_pro_profiles (id) values (1)');
  perform public.expect_denied('delete from public.repair_pro_profiles where id = 1');
  perform public.expect_denied('update public.repair_pro_profiles set future_trust_field = ''approved'' where id = 1');
end;
$$;
reset role;
set role anon;
select public.expect_denied('update public.profiles set role = ''admin'' where id = 1');
select public.expect_denied('update public.service_requests set status = ''completed'' where id = 1');
reset role;

-- Service-role APIs retain writes; migrations/database owners retain writes.
set role service_role;
update public.profiles set role = 'motorist' where id = 1;
update public.service_requests set status = 'completed' where id = 1;
update public.motorist_profiles set verified = true where id = 1;
update public.repair_pro_profiles set verified = true, rating_avg = 5 where id = 1;
insert into public.job_events (id) values (3);
delete from public.job_events where id = 3;
reset role;
update public.service_requests set status = 'requested' where id = 1;

-- Existing owner-run SECURITY DEFINER functions remain compatible too.
create function public.fixture_server_transition() returns void
language sql security definer set search_path = public as $$
  update public.service_requests set status = 'completed' where id = 1;
$$;
set role authenticated;
select public.fixture_server_transition();
reset role;
do $$
begin
  if not exists (select 1 from public.service_requests where id = 1 and status = 'completed') then
    raise exception 'Trusted SECURITY DEFINER write failed';
  end if;
end;
$$;

\echo 'PASS: migration reapplies; protected client writes denied; presence and trusted writes preserved.'
