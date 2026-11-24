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

describe.each([
  ["light", MAP_STYLES_LIGHT],
  ["dark", MAP_STYLES_DARK],
])("%s map neighbourhood detail", (_name, styles) => {
  const find = (featureType: string, elementType?: string) =>
    styles.filter(
      (s) =>
        s.featureType === featureType &&
        (elementType === undefined || s.elementType === elementType),
    );

  it("shows neighbourhood names", () => {
    const rules = find("administrative.neighborhood", "labels.text");
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.at(-1)?.stylers).toContainEqual({ visibility: "on" });
  });

  it("gives side streets their own visible fill and name colour", () => {
    expect(find("road.local", "geometry.fill").length).toBeGreaterThan(0);
    expect(find("road.local", "labels.text.fill").length).toBeGreaterThan(0);
  });

  it("names a few landmark types as text only, and keeps shops hidden", () => {
    for (const type of ["poi.school", "poi.place_of_worship", "poi.medical"]) {
      expect(find(type).some((s) => s.stylers.some((x) => x.visibility === "on"))).toBe(true);
      expect(
        find(type, "labels.icon").every((s) =>
          s.stylers.some((x) => x.visibility === "off"),
        ),
      ).toBe(true);
    }
    expect(find("poi.business")).toEqual([]);
    // all POIs are still hidden by default, so only the listed landmarks come back
    expect(find("poi").some((s) => s.elementType === undefined && s.stylers.some((x) => x.visibility === "off"))).toBe(true);
  });

  it("applies the neighbourhood rules after the base rules so they win", () => {
    const poiOff = styles.findIndex(
      (s) => s.featureType === "poi" && s.elementType === undefined,
    );
    const schoolOn = styles.findIndex(
      (s) => s.featureType === "poi.school" && s.elementType === undefined,
    );
    expect(poiOff).toBeGreaterThanOrEqual(0);
    expect(schoolOn).toBeGreaterThan(poiOff);
  });
});
