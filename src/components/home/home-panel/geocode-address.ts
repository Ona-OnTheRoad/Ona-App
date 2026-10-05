import { knownPlaceToPick, resolveKnownPlace } from "@/lib/known-places";

/** Fallback geocode when Places is unavailable (curated places first). */
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
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      q,
    )}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const data = (await res.json()) as {
      lat?: string;
      lon?: string;
      display_name?: string;
    }[];
    const hit = data?.[0];
    if (!hit?.lat || !hit?.lon) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    // Real Nominatim label do not snap coords to curated POI names
    return {
      lat,
      lng,
      label: hit.display_name || q,
    };
  } catch {
    return null;
  }
}
