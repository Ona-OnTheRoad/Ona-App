import type { OnaMapStyle } from "./palette";

/**
 * Landmark types worth naming on the map so people can place themselves
 * (schools, churches / mosques, clinics, government offices, sports grounds).
 * Shops and restaurants stay hidden: too many, and they compete with the pros.
 */
export const LANDMARK_FEATURES = [
  "poi.school",
  "poi.place_of_worship",
  "poi.medical",
  "poi.government",
  "poi.sports_complex",
] as const;

/**
 * Style entries that add neighbourhood context on top of the base map:
 * area names stand out, side streets are visible and named, and a few landmark
 * names appear as text only (no icons). Append AFTER the base rules so they win.
 */
export function neighbourhoodStyles(colors: {
  areaLabel: string;
  sideStreetLabel: string;
  landmarkLabel: string;
  localRoad: string;
  arterialRoad?: string;
  highwayRoad?: string;
}): OnaMapStyle[] {
  const rules: OnaMapStyle[] = [
    {
      featureType: "administrative.neighborhood",
      elementType: "labels.text",
      stylers: [{ visibility: "on" }],
    },
    {
      featureType: "administrative.neighborhood",
      elementType: "labels.text.fill",
      stylers: [{ color: colors.areaLabel }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: colors.areaLabel }],
    },
    {
      featureType: "road.local",
      elementType: "geometry.fill",
      stylers: [{ color: colors.localRoad }],
    },
    {
      featureType: "road.local",
      elementType: "labels.text.fill",
      stylers: [{ color: colors.sideStreetLabel }],
    },
  ];
  if (colors.arterialRoad) {
    rules.push({
      featureType: "road.arterial",
      elementType: "geometry.fill",
      stylers: [{ color: colors.arterialRoad }],
    });
  }
  if (colors.highwayRoad) {
    rules.push({
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [{ color: colors.highwayRoad }],
    });
  }
  for (const featureType of LANDMARK_FEATURES) {
    rules.push(
      { featureType, stylers: [{ visibility: "on" }] },
      { featureType, elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      {
        featureType,
        elementType: "labels.text.fill",
        stylers: [{ color: colors.landmarkLabel }],
      },
    );
  }
  return rules;
}
