-- Notifications belong to one side of a job. A user who is both a customer and
-- a Repair Pro shares one user_id, so without this the customer-side and
-- pro-side notifications were merged into a single list.
-- NULL audience = not tied to a role (security, system, chat) -> shown in both.
-- Idempotent.

alter table public.notifications
  add column if not exists audience text;

alter table public.notifications
  drop constraint if exists notifications_audience_check;
alter table public.notifications
  add constraint notifications_audience_check
  check (audience is null or audience in ('motorist', 'professional'));

create index if not exists notifications_user_audience_created_idx
  on public.notifications (user_id, audience, created_at desc);

-- Backfill from the job: the recipient's side of that job.
update public.notifications n
set audience = case
  when sr.motorist_id = n.user_id then 'motorist'
  when sr.repair_pro_id = n.user_id then 'professional'
  else null
end
from public.service_requests sr
where n.audience is null
  and n.job_id is not null
  and sr.id = n.job_id;
