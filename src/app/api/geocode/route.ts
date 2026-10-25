import { NextRequest, NextResponse } from "next/server";
import { getGoogleMapsApiKey } from "@/lib/google-maps";
import { matchKnownPlaces } from "@/lib/known-places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface GeocodeResult {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  lat: number;
  lng: number;
}

interface CacheEntry {
  results: GeocodeResult[];
  expiresAt: number;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 500;

let lastNominatimRequestTime = 0;
const NOMINATIM_MIN_INTERVAL_MS = 1000;

async function throttleNominatim(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastNominatimRequestTime;
  if (timeSinceLast < NOMINATIM_MIN_INTERVAL_MS) {
    const delay = NOMINATIM_MIN_INTERVAL_MS - timeSinceLast;
    lastNominatimRequestTime = now + delay;
    await new Promise((resolve) => setTimeout(resolve, delay));
  } else {
    lastNominatimRequestTime = now;
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const limitParam = Number(req.nextUrl.searchParams.get("limit")) || 5;
  const limit = Math.max(1, Math.min(limitParam, 10));

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `${q.toLowerCase()}|${limit}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ results: cached.results.slice(0, limit), cached: true });
  }

  const results: GeocodeResult[] = [];
  let upstreamFailed = false;
  const seenPlaceKeys = new Set<string>();

  // 1. High-priority local curated places
  const knownMatches = matchKnownPlaces(q, 3);
  for (const km of knownMatches) {
    const p = km.place;
    const key = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    seenPlaceKeys.add(key);
    results.push({
      id: `known-${p.id}`,
      label: `${p.name}, ${p.city || "Lagos"}`,
      primary: p.name,
      secondary: p.address || `${p.city || "Lagos"}, Nigeria`,
      lat: p.lat,
      lng: p.lng,
    });
  }

  // 2. Try Google Geocoding API if key configured on server
  const googleKey = getGoogleMapsApiKey();
  if (googleKey) {
    try {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        q,
      )}&components=country:NG&key=${encodeURIComponent(googleKey)}`;
      const gRes = await fetch(gUrl);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status !== "OK" && gData.status !== "ZERO_RESULTS") {
          upstreamFailed = true;
        }
        if (gData.status === "OK" && Array.isArray(gData.results)) {
          for (const item of gData.results) {
            if (results.length >= limit) break;
            const lat = item.geometry?.location?.lat;
            const lng = item.geometry?.location?.lng;
            if (typeof lat === "number" && typeof lng === "number") {
              const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
              if (!seenPlaceKeys.has(key)) {
                seenPlaceKeys.add(key);
                const parts = (item.formatted_address || "").split(",");
                const primary = parts[0]?.trim() || q;
                const secondary = parts.slice(1, 4).join(",").trim() || "Nigeria";
                results.push({
                  id: `google-${item.place_id || results.length}`,
                  label: item.formatted_address || `${primary}, ${secondary}`,
                  primary,
                  secondary,
                  lat,
                  lng,
                });
              }
            }
          }
        }
      } else {
        upstreamFailed = true;
      }
    } catch {
      upstreamFailed = true;
      /* fallback below */
    }
  }

  // 3. Fallback to OpenStreetMap Nominatim with strict throttling and compliant User-Agent
  if (results.length < limit) {
    try {
      await throttleNominatim();
      const osmQuery = encodeURIComponent(`${q}, Nigeria`);
      const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${osmQuery}&countrycodes=ng&addressdetails=1&limit=${limit}`;
      const osmRes = await fetch(osmUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Ona/1.0 (https://ona.app; address autocomplete)",
        },
      });

      if (osmRes.ok) {
        const osmData = await osmRes.json();
        if (Array.isArray(osmData)) {
          for (const item of osmData) {
            if (results.length >= limit) break;
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
              if (!seenPlaceKeys.has(key)) {
                seenPlaceKeys.add(key);
                const parts = (item.display_name || "").split(",");
                const primary = parts[0]?.trim() || item.name || q;
                const secondary = parts.slice(1, 4).join(",").trim() || "Nigeria";
                results.push({
                  id: `osm-${item.place_id}`,
                  label: item.display_name || `${primary}, ${secondary}`,
                  primary,
                  secondary,
                  lat,
                  lng,
                });
              }
            }
          }
        }
      } else {
        upstreamFailed = true;
      }
    } catch {
      upstreamFailed = true;
      /* ignore network drop */
    }
  }

  // Don't cache degraded answers: a transient upstream failure must not
  // pin an empty/partial list for the full TTL.
  if (!upstreamFailed) {
    if (CACHE.size >= MAX_CACHE_SIZE) {
      const oldestKey = CACHE.keys().next().value;
      if (oldestKey) CACHE.delete(oldestKey);
    }
    CACHE.set(cacheKey, {
      results,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  return NextResponse.json({ results: results.slice(0, limit), cached: false });
}
