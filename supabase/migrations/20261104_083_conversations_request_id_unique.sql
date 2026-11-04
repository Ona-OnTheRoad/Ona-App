-- One conversation per service request (nullable request_id still allowed).
-- Concurrent /api/conversations/ensure inserts could otherwise create split threads.

-- Keep the oldest conversation per request_id; move messages off duplicates; drop extras.
with ranked as (
  select
    id,
    request_id,
    row_number() over (
      partition by request_id
      order by created_at asc nulls last, id asc
    ) as rn
  from public.conversations
  where request_id is not null
),
keepers as (
  select id, request_id from ranked where rn = 1
),
dupes as (
  select id, request_id from ranked where rn > 1
)
update public.messages m
set conversation_id = k.id
from dupes d
join keepers k on k.request_id = d.request_id
where m.conversation_id = d.id;

with ranked as (
  select
    id,
    request_id,
    row_number() over (
      partition by request_id
      order by created_at asc nulls last, id asc
    ) as rn
  from public.conversations
  where request_id is not null
)
delete from public.conversations c
using ranked r
where c.id = r.id
  and r.rn > 1;

create unique index if not exists conversations_request_id_uidx
  on public.conversations (request_id)
  where request_id is not null;
