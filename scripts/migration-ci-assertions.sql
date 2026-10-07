-- Fail loudly; table existence alone does not establish permission boundaries.
do $$
declare name text; signature text;
begin
  foreach name in array array['target_type', 'target_id', 'action_type', 'admin_name', 'old_value', 'new_value', 'reason', 'result', 'status', 'error_message', 'ip_address', 'device_info'] loop
    if not exists (select 1 from information_schema.columns where table_schema = 'public'
        and table_name = 'admin_actions' and column_name = name) then
      raise exception 'Missing audit table upgrade column %', name;
    end if;
  end loop;
  if not exists (select 1 from information_schema.columns where table_schema = 'public'
      and table_name = 'service_requests' and column_name = 'job_version'
      and is_nullable = 'NO' and data_type = 'bigint') then
    raise exception 'Missing non-null bigint job_version';
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.service_requests'::regclass
      and tgname = 'service_requests_bump_job_version' and tgenabled = 'O') then
    raise exception 'Missing enabled version trigger';
  end if;
  foreach name in array array['job_sweep_leases', 'payment_webhook_inbox', 'payment_reconciliation_queue', 'job_outbox'] loop
    if not exists (select 1 from pg_class where oid = ('public.' || name)::regclass and relrowsecurity) then
      raise exception 'RLS missing on %', name;
    end if;
    if has_table_privilege('anon', 'public.' || name, 'SELECT,INSERT,UPDATE,DELETE')
        or has_table_privilege('authenticated', 'public.' || name, 'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'Client role has private table privileges on %', name;
    end if;
    if not has_table_privilege('service_role', 'public.' || name, 'SELECT')
        or not has_table_privilege('service_role', 'public.' || name, 'INSERT')
        or not has_table_privilege('service_role', 'public.' || name, 'UPDATE')
        or not has_table_privilege('service_role', 'public.' || name, 'DELETE') then
      raise exception 'Service role missing private table privileges on %', name;
    end if;
  end loop;
  foreach signature in array array[
    'public.claim_job_sweep_lease(text,uuid)',
    'public.release_job_sweep_lease(text,uuid)',
    'public.apply_confirmed_job_payment(uuid,uuid,bigint,text,text,bigint,text,timestamptz,text)',
    'public.claim_payment_webhook_inbox(integer,integer,uuid)',
    'public.finish_payment_webhook_inbox(uuid,integer,text,text,integer)',
    'public.claim_payment_reconciliation(integer,integer)',
    'public.finish_payment_reconciliation(uuid,integer,text,text,integer)',
    'public.drain_job_outbox(integer)'
  ] loop
    if has_function_privilege('anon', signature, 'EXECUTE')
        or has_function_privilege('authenticated', signature, 'EXECUTE')
        or not has_function_privilege('service_role', signature, 'EXECUTE') then
      raise exception 'Incorrect RPC execute privileges: %', signature;
    end if;
  end loop;
end $$;
