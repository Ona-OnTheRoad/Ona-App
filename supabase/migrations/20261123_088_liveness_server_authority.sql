-- ============================================================
-- Tier 3 liveness: server evidence column + legacy self-attest flag
--
-- Until this change any signed-in client could set face_liveness_verified
-- (POST /api/liveness/verify with passed:true, /api/profile/update
-- faceLivenessVerified, /api/artisan/profile livenessPassedAt). Those paths
-- are closed in code; only a server Prembly face check now sets the flag,
-- and it writes its evidence to liveness_meta.
--
-- Existing rows are GRANDFATHERED by product decision (2026-11-23): their
-- flags and visibility_tier are not changed. Rows that carry a liveness flag
-- but no server evidence are tagged source = 'legacy_self_attested' so Care
-- can find and clear them. Idempotent.
--
-- liveness_meta is server-only: migration 077's client-write guard rejects
-- any direct client change to a non-presence column, and 031 grants anon
-- only an explicit column list that does not include it.
-- ============================================================

begin;

alter table public.repair_pro_profiles
  add column if not exists liveness_meta jsonb;

comment on column public.repair_pro_profiles.liveness_meta is
  'Tier 3 liveness evidence written by /api/liveness/verify (provider, mode, reference, confidence, verifiedAt; never the NIN or image). source = legacy_self_attested marks pre-088 client-set flags kept by the grandfather decision.';

update public.repair_pro_profiles
set liveness_meta = jsonb_build_object(
  'source', 'legacy_self_attested',
  'flaggedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'note', 'Set by a client path before migration 088; not provider-verified.'
)
where liveness_meta is null
  and (face_liveness_verified is true or liveness_passed_at is not null);

create index if not exists repair_pro_profiles_liveness_legacy_idx
  on public.repair_pro_profiles ((liveness_meta->>'source'))
  where liveness_meta->>'source' = 'legacy_self_attested';

commit;
