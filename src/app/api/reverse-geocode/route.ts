import { NextRequest, NextResponse } from "next/server";
import { reverseGeocodeLatLngServer } from "@/lib/google-maps";
import { checkIpRateLimit } from "@/lib/server/modules/ip-rate-limit";

/**
 * Server-side reverse geocode (Google → Nominatim).
 * Avoids browser CORS / User-Agent limits on Nominatim.
 */
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng are required numbers" },
      { status: 400 },
    );
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json(
      { error: "lat/lng out of range" },
      { status: 400 },
    );
  }

  const limit = await checkIpRateLimit(req, {
    name: "reverse-geocode",
    limit: 60,
    windowMs: 60_000,
    failOpen: true,
  });
  if (!limit.ok && limit.reason === "limited") {
    const res = NextResponse.json(
      { error: "Too many requests. Slow down a moment." },
      { status: 429 },
    );
    res.headers.set("Retry-After", String(limit.retryAfterSec));
    return res;
  }

  const result = await reverseGeocodeLatLngServer(lat, lng);
  if (!result) {
    return NextResponse.json({ error: "No address found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
