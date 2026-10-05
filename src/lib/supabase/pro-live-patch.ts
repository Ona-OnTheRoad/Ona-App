/**
 * Go Live fallback: the only repair_pro_profiles columns the browser may
 * UPDATE directly (every other column is blocked by the database).
 * This type is the allow-list: adding any other column to the patch is a
 * compile error.
 */
export type ProLivePatch = {
  is_online?: boolean;
  lat?: number;
  lng?: number;
  location_updated_at?: string;
  updated_at?: string;
};

export function buildProLivePatch(
  online: boolean,
  coords: { lat: number; lng: number } | undefined,
  now: string = new Date().toISOString(),
): ProLivePatch {
  const patch: ProLivePatch = { is_online: online, updated_at: now };
  if (online) {
    // Heartbeat stamp even without new GPS so Live stays marketplace-visible
    patch.location_updated_at = now;
    if (coords) {
      patch.lat = coords.lat;
      patch.lng = coords.lng;
    }
  }
  return patch;
}
