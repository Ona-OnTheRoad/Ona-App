-- Fail loudly; table existence alone does not establish permission boundaries.
do $$
declare name text; signature text;
begin
  if not exists (select 1 from pg_index where indexrelid =
      to_regclass('public.payments_idempotent_transfer_ref_unique') and indisunique and indisvalid) then
    raise exception 'Missing valid unique payment transfer reference index';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public'
      and table_name = 'payments' and column_name = 'amount_kobo'
      and data_type = 'bigint' and is_nullable = 'NO') then
    raise exception 'Missing actual non-null bigint payment amount_kobo';
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_trgm') then
    raise exception 'Missing shop search extension pg_trgm';
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_cron') or to_regclass('cron.job') is null then
    raise exception 'Missing payout scheduler extension pg_cron';
  end if;
  foreach name in array array['Users upload own avatar', 'Users update own avatar', 'Public read avatars', 'Service role manage avatars', 'Public read shop media', 'Service role manage shop media'] loop
    if not exists (select 1 from pg_policies where schemaname = 'storage'
        and tablename = 'objects' and policyname = name) then
      raise exception 'Missing storage policy %', name;
    end if;
  end loop;
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
    'public.open_pairing_request(uuid,uuid,text,integer,integer)',
    'public.dispatch_pairing_offer(uuid,bigint,text,uuid,text,text,integer)',
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
