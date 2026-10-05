export type RouteEta = {
  minutes: number;
  distanceKm: number;
  durationText?: string;
  distanceText?: string;
};

/** Haversine distance + ~25 km/h city crawl ETA (no Distance Matrix). */
export function haversineRouteEta(
  proPos: { lat: number; lng: number },
  motoristPos: { lat: number; lng: number },
): RouteEta {
  const R = 6371;
  const dLat = ((motoristPos.lat - proPos.lat) * Math.PI) / 180;
  const dLng = ((motoristPos.lng - proPos.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((proPos.lat * Math.PI) / 180) *
      Math.cos((motoristPos.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const km =
    Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
  // ~25 km/h city crawl estimate
  const minutes = Math.max(1, Math.round((km / 25) * 60));
  return {
    minutes,
    distanceKm: km,
    durationText: `${minutes} min`,
    distanceText: km < 1 ? `${Math.round(km * 1000)} m` : `${km} km`,
  };
}
