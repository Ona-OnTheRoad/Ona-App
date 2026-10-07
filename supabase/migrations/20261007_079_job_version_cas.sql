begin;

alter table public.service_requests
  add column if not exists job_version bigint not null default 0;

create or replace function public.bump_service_request_job_version()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.job_version := old.job_version + 1;
  return new;
end;
$$;

drop trigger if exists service_requests_bump_job_version on public.service_requests;
create trigger service_requests_bump_job_version
before update on public.service_requests
for each row execute function public.bump_service_request_job_version();

comment on column public.service_requests.job_version is
  'Monotonic optimistic concurrency token. Server writes must compare the version they read.';

commit;
