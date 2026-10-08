-- Coordinate indexes for the actual Ona schema.
-- The original PostGIS draft targeted public.jobs and latitude/longitude,
-- neither of which exists in this migration chain. No application consumer
-- uses its geography fields. Discovery remains haversine-based; do not add a
-- speculative PostGIS dependency or a second jobs table during fresh replay.

create index if not exists repair_pro_profiles_live_location_idx
  on public.repair_pro_profiles (lat, lng)
  where is_online = true and lat is not null and lng is not null;

create index if not exists service_requests_pickup_location_idx
  on public.service_requests (pickup_lat, pickup_lng)
  where pickup_lat is not null and pickup_lng is not null;

create index if not exists service_requests_pro_location_idx
  on public.service_requests (pro_lat, pro_lng)
  where pro_lat is not null and pro_lng is not null;
