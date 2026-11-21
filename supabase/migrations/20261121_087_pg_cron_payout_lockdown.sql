-- ============================================================
-- pg_cron payout-retry job: private functions, header auth, URL from config
--
-- Fixes three defects in migration 067:
--
-- 1. set_cron_secret / install_payout_retry_cron / payout_retry_cron_status
--    are security definer and kept Postgres's default PUBLIC execute, so the
--    anon key could overwrite the payout secret or reinstall the job. They
--    are now service_role only (the SQL editor runs as postgres, which owns
--    them). pairing_sweep() from 047 gets the same treatment when present.
--
-- 2. The job called net.http_post(url, '{}', jsonb_build_object(...)) by
--    position. pg_net's signature is (url, body, params, headers, ...), so
--    the bearer token went out as a query parameter and no Authorization
--    header was sent. The job now uses named arguments.
--
-- 3. The endpoint was hard-coded to https://336699.vercel.app. The origin
--    now comes from ona_cron_config.payout_retry_url (https origin only),
--    read on every run like the secret, so a host change or secret
--    rotation needs no reinstall and no database calls a host by default.
--
-- Setup (SQL editor, after enabling pg_cron and pg_net):
--   select public.set_cron_secret('payout_retry_secret', '<CRON_SECRET>');
--   select public.set_cron_secret('payout_retry_url', 'https://<host>');
--   select public.install_payout_retry_cron();
-- ============================================================

-- An https origin: no path, query, fragment or credentials.
create or replace function public.is_valid_cron_origin(p_value text)
returns boolean
language sql
immutable
set search_path = ''
as $fn$
  select coalesce(p_value ~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?$', false);
$fn$;

-- Seed/rotate a cron config value. Rejects a malformed payout_retry_url so
-- the job can never be pointed at a path, plain http or a credentialed URL.
create or replace function public.set_cron_secret(p_name text, p_value text)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if p_name = 'payout_retry_url' and not public.is_valid_cron_origin(p_value) then
    raise exception 'payout_retry_url must be an https origin with no path, e.g. https://example.vercel.app'
      using errcode = '22023';
  end if;
  insert into public.ona_cron_config(name, value, updated_at)
  values (p_name, p_value, now())
  on conflict (name) do update
    set value = excluded.value, updated_at = now();
end;
$fn$;

-- (Re)install the 10-minute payout-retry job. Safe to call again.
create or replace function public.install_payout_retry_cron()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_url text;
  v_secret text;
begin
  select value into v_url from public.ona_cron_config where name = 'payout_retry_url';
  select value into v_secret from public.ona_cron_config where name = 'payout_retry_secret';

  if v_url is null or v_url = '' then
    return jsonb_build_object('ok', false, 'reason', 'needs_url',
      'msg', 'Seed the payout-retry origin first: '
            'select public.set_cron_secret(''payout_retry_url'', ''https://<host>'')');
  end if;
  if not public.is_valid_cron_origin(v_url) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_url',
      'msg', 'payout_retry_url must be an https origin with no path');
  end if;
  if v_secret is null or v_secret = '' then
    return jsonb_build_object('ok', false, 'reason', 'needs_secret',
      'msg', 'Seed the secret first (same value as CRON_SECRET on the host): '
            'select public.set_cron_secret(''payout_retry_secret'', ''...'')');
  end if;
  if to_regclass('cron.job') is null then
    return jsonb_build_object('ok', false, 'reason', 'needs_pg_cron',
      'msg', 'pg_cron extension is not enabled');
  end if;
  if not exists (
    select 1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'net' and p.proname = 'http_post'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'needs_pg_net',
      'msg', 'pg_net extension is not enabled (Supabase dashboard > Database > Extensions)');
  end if;

  if exists (select 1 from cron.job where jobname = 'ona-payout-retry') then
    perform cron.unschedule('ona-payout-retry');
  end if;

  -- URL and secret are read on every run; neither is stored in cron.job.
  perform cron.schedule(
    'ona-payout-retry',
    '*/10 * * * *',
    $job$select net.http_post(
      url := (select value from public.ona_cron_config
               where name = 'payout_retry_url') || '/api/payments/payout-retry',
      body := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select value from public.ona_cron_config
                                        where name = 'payout_retry_secret')
      )
    )$job$
  );

  return jsonb_build_object('ok', true,
    'job', 'ona-payout-retry', 'schedule', '*/10 * * * *',
    'endpoint', v_url || '/api/payments/payout-retry',
    'installed_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
end;
$fn$;

-- Ops view: jobs plus config state. Never returns the secret.
create or replace function public.payout_retry_cron_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_jobs jsonb := '{}'::jsonb;
begin
  if to_regclass('cron.job') is not null then
    execute $q$
      select coalesce(jsonb_object_agg(j.jobname,
               jsonb_build_object('schedule', j.schedule, 'active', j.active)), '{}'::jsonb)
      from cron.job j
      where j.jobname in ('ona-payout-retry', 'ona-pairing-sweep')
    $q$ into v_jobs;
  end if;
  return jsonb_build_object(
    'jobs', v_jobs,
    'payout_retry_url',
      (select value from public.ona_cron_config where name = 'payout_retry_url'),
    'payout_retry_secret_configured',
      exists (select 1 from public.ona_cron_config
              where name = 'payout_retry_secret' and value <> ''));
end;
$fn$;

-- Service role (and the owning postgres role / SQL editor) only.
revoke all on function public.is_valid_cron_origin(text) from public, anon, authenticated;
revoke all on function public.set_cron_secret(text, text) from public, anon, authenticated;
revoke all on function public.install_payout_retry_cron() from public, anon, authenticated;
revoke all on function public.payout_retry_cron_status() from public, anon, authenticated;
grant execute on function public.is_valid_cron_origin(text) to service_role;
grant execute on function public.set_cron_secret(text, text) to service_role;
grant execute on function public.install_payout_retry_cron() to service_role;
grant execute on function public.payout_retry_cron_status() to service_role;

do $do$
begin
  if to_regprocedure('public.pairing_sweep()') is not null then
    execute 'revoke all on function public.pairing_sweep() from public, anon, authenticated';
    execute 'grant execute on function public.pairing_sweep() to service_role';
  end if;
end
$do$;

-- The 067 job cannot authenticate (secret sent as a query param, fixed host).
-- Remove it, then reinstall only when both URL and secret are configured.
do $do$
begin
  -- Nested so cron.job is only planned once it is known to exist.
  if to_regclass('cron.job') is not null then
    if exists (select 1 from cron.job where jobname = 'ona-payout-retry') then
      perform cron.unschedule('ona-payout-retry');
    end if;
  end if;
  if exists (select 1 from public.ona_cron_config where name = 'payout_retry_url')
     and exists (select 1 from public.ona_cron_config
                 where name = 'payout_retry_secret' and value <> '') then
    perform public.install_payout_retry_cron();
  end if;
end
$do$;
