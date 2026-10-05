import { cleanAddressLabel } from "@/lib/google-maps";
import type { PickedLocation } from "./types";

export function parseGeocodeResult(
  result: google.maps.GeocoderResult,
  lat: number,
  lng: number,
): PickedLocation {
  const comps = result.address_components ?? [];
  const get = (type: string) =>
    comps.find((c) => c.types.includes(type))?.long_name ?? "";

  const area =
    get("neighborhood") ||
    get("sublocality") ||
    get("sublocality_level_1") ||
    get("route") ||
    get("administrative_area_level_2") ||
    "";
  const city =
    get("locality") ||
    get("administrative_area_level_1") ||
    get("country") ||
    "Nigeria";
  const label =
    cleanAddressLabel(
      result.formatted_address || [area, city].filter(Boolean).join(", "),
    ) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  // Real street address only curated POIs are search suggestions, not snaps
  return { lat, lng, label, city, area: area || city };
}
