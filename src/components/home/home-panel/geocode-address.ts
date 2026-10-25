import { knownPlaceToPick, resolveKnownPlace } from "@/lib/known-places";

/** Fallback geocode when Places is unavailable (curated places first, then /api/geocode). */
export async function geocodeAddress(
  query: string,
): Promise<{ lat: number; lng: number; label: string } | null> {
  const q = query.trim();
  if (!q) return null;
  const known = resolveKnownPlace(q);
  if (known) {
    const p = knownPlaceToPick(known);
    return { lat: p.lat, lng: p.lng, label: p.label };
  }
  try {
    const url = `/api/geocode?q=${encodeURIComponent(q)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: Array<{ lat: number; lng: number; label: string }>;
    };
    const hit = json.results?.[0];
    if (!hit || typeof hit.lat !== "number" || typeof hit.lng !== "number") return null;
    return {
      lat: hit.lat,
      lng: hit.lng,
      label: hit.label || q,
    };
  } catch {
    return null;
  }
}
