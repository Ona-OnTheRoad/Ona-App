import { describe, expect, it } from "vitest";
import { MAP_STYLES_DARK, MAP_STYLES_LIGHT } from "@/lib/map-theme";

/**
 * Google Maps rejects the WHOLE style array if one entry has an unknown feature or element type
 * ("InvalidValueError: invalid style feature type"), which silently drops the app's map theme.
 * Lists are from the Maps JavaScript API style reference.
 */
const FEATURE_TYPES = new Set([
  "all",
  "administrative",
  "administrative.country",
  "administrative.land_parcel",
  "administrative.locality",
  "administrative.neighborhood",
  "administrative.province",
  "landscape",
  "landscape.man_made",
  "landscape.natural",
  "landscape.natural.landcover",
  "landscape.natural.terrain",
  "poi",
  "poi.attraction",
  "poi.business",
  "poi.government",
  "poi.medical",
  "poi.park",
  "poi.place_of_worship",
  "poi.school",
  "poi.sports_complex",
  "road",
  "road.arterial",
  "road.highway",
  "road.highway.controlled_access",
  "road.local",
  "transit",
  "transit.line",
  "transit.station",
  "transit.station.airport",
  "transit.station.bus",
  "transit.station.rail",
  "water",
]);

const ELEMENT_TYPES = new Set([
  "all",
  "geometry",
  "geometry.fill",
  "geometry.stroke",
  "labels",
  "labels.icon",
  "labels.text",
  "labels.text.fill",
  "labels.text.stroke",
]);

describe.each([
  ["light", MAP_STYLES_LIGHT],
  ["dark", MAP_STYLES_DARK],
])("%s map style", (_name, styles) => {
  it("uses only feature types Google Maps accepts", () => {
    const bad = styles
      .map((s) => s.featureType)
      .filter((t): t is string => typeof t === "string" && !FEATURE_TYPES.has(t));
    expect(bad).toEqual([]);
  });

  it("uses only element types Google Maps accepts", () => {
    const bad = styles
      .map((s) => s.elementType)
      .filter((t): t is string => typeof t === "string" && !ELEMENT_TYPES.has(t));
    expect(bad).toEqual([]);
  });
});
