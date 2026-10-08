-- Legacy maintenance targeted public.jobs, which is absent from the application
-- schema. Preserve its legacy behavior when that table exists; do not redirect
-- a historical escrow mutation to live service_requests.
do $$
begin
if to_regclass('public.jobs') is not null then
execute $legacy$
UPDATE public.jobs
SET 
  status = 'cancelled',
  escrow_status = CASE WHEN escrow_status = 'held' THEN 'refunded' ELSE escrow_status END,
  cancelled_at = NOW(),
  updated_at = NOW()
WHERE 
  service_type = 'solar'
  AND status NOT IN ('released', 'refunded', 'cancelled', 'expired')
$legacy$;
else
  raise notice 'Legacy solar cleanup: public.jobs is absent';
end if;
end $$;
