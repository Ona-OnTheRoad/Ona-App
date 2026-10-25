-- Read-only check that migration 077 is still in force on a hosted database.
-- Safe to run in the Supabase SQL editor or with psql: it only reads catalogs.
-- Every row should have ok = true. Any false row means a grant, guard trigger
-- or dropped policy has drifted from 20261004_077_lock_client_writes.sql.
--
-- The guard triggers are what block writes. A false grant row with every
-- trigger row true is still drift to fix (a blanket regrant, as 031 did), but
-- client writes stay blocked. A false trigger row means writes are open.
--
-- For the migration's behaviour (denied writes, presence updates, regrant
-- resistance) use client-write-lockdown.sql in a disposable local database.

begin transaction read only;

with locked(tbl, priv) as (
  -- No client writes at all.
  select t, p
  from unnest(array['profiles', 'service_requests', 'job_status_events',
                    'job_events', 'motorist_profiles']) as t,
       unnest(array['INSERT', 'UPDATE', 'DELETE']) as p
  union all
  -- Presence heartbeat updates stay allowed; inserts and deletes do not.
  select 'repair_pro_profiles', p from unnest(array['INSERT', 'DELETE']) as p
),
client_roles(role) as (values ('authenticated'), ('anon')),
grant_checks as (
  -- has_any_column_privilege also catches column-level INSERT/UPDATE grants.
  select 'grant'::text as kind,
         format('%s %s on %s', r.role, l.priv, l.tbl) as item,
         not case l.priv
           when 'DELETE' then has_table_privilege(r.role, format('public.%I', l.tbl), l.priv)
           else has_any_column_privilege(r.role, format('public.%I', l.tbl), l.priv)
         end as ok
  from locked l cross join client_roles r
),
expected_triggers(tbl, trg) as (
  values ('profiles', 'trg_zz_ona_block_client_write'),
         ('service_requests', 'trg_zz_ona_block_client_write'),
         ('job_status_events', 'trg_zz_ona_block_client_write'),
         ('job_events', 'trg_zz_ona_block_client_write'),
         ('motorist_profiles', 'trg_zz_ona_block_client_write'),
         ('repair_pro_profiles', 'trg_zz_ona_guard_client_write')
),
trigger_checks as (
  -- tgenabled 'D' means the trigger exists but is disabled.
  select 'trigger', format('%s on %s', e.trg, e.tbl),
         coalesce(t.tgenabled <> 'D', false)
  from expected_triggers e
  left join pg_trigger t
    on t.tgname = e.trg
   and t.tgrelid = format('public.%I', e.tbl)::regclass
   and not t.tgisinternal
),
dropped_policies(tbl, pol) as (
  values ('profiles', 'profiles_update_own'),
         ('profiles', 'profiles_admin_insert'),
         ('service_requests', 'requests_update_parties'),
         ('service_requests', 'requests_insert_motorist'),
         ('job_status_events', 'job_events_insert')
),
policy_checks as (
  select 'policy absent', format('%s on %s', d.pol, d.tbl),
         not exists (select 1 from pg_policies p
                     where p.schemaname = 'public'
                       and p.tablename = d.tbl
                       and p.policyname = d.pol)
  from dropped_policies d
),
function_checks as (
  select 'function', f, to_regprocedure(format('public.%s()', f)) is not null
  from unnest(array['ona_is_client_role', 'ona_block_client_write',
                    'ona_guard_pro_profile_client_write']) as f
)
select kind, item, ok from grant_checks
union all select * from trigger_checks
union all select * from policy_checks
union all select * from function_checks
order by ok, kind, item;

rollback;
