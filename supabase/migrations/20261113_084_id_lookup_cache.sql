-- ============================================================
-- NIN lookup cache (provider-outage fallback)
--
-- A live NIN confirmation from the ID provider is remembered so the
-- same NIN can still be confirmed while the provider is down. The
-- server reads it only when the provider cannot answer.
--
-- key_hash is an HMAC-SHA256 of the number under a server secret:
-- the table never holds a NIN. result holds the provider reference
-- and the holder's name. Rows are ignored after expires_at and are
-- removed by the server on the next write.
-- ============================================================

create table if not exists public.id_lookup_cache (
  key_hash text primary key,
  kind text not null default 'nin' check (kind in ('nin')),
  result jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists id_lookup_cache_expires_at_idx
  on public.id_lookup_cache (expires_at);

-- Service role only: never readable or writable through PostgREST by
-- anon / authenticated (same stance as idempotent_ops, migration 064).
alter table public.id_lookup_cache enable row level security;
alter table public.id_lookup_cache force row level security;
revoke all on table public.id_lookup_cache from anon, authenticated;
grant all on table public.id_lookup_cache to service_role, postgres;
