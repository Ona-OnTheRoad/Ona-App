import type { PickedLocation } from "../location-picker-map";

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
    result.formatted_address ||
    [area, city].filter(Boolean).join(", ") ||
    `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return { lat, lng, label, city, area: area || city };
}
