import {
  MAP_LABEL_DARK,
  MAP_LAND_DARK,
  MAP_PARK_DARK,
  MAP_ROAD_DARK,
  MAP_WATER_DARK,
  type OnaMapStyle,
} from "./palette";

/**
 * Dark map (Figma): flat land, near-black roads with no outline,
 * soft parks, street names only. POIs and transit are hidden so the pros stand out.
 */
export const MAP_STYLES_DARK: OnaMapStyle[] = [
  { elementType: "geometry", stylers: [{ color: MAP_LAND_DARK }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: MAP_LABEL_DARK }] },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0c1815" }, { weight: 2 }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1d2b27" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ visibility: "on" }, { color: MAP_PARK_DARK }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: MAP_ROAD_DARK }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: MAP_WATER_DARK }],
  },
];
