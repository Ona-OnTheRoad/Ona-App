import {
  MAP_LABEL_LIGHT,
  MAP_LAND_LIGHT,
  MAP_PARK_LIGHT,
  MAP_ROAD_LIGHT,
  MAP_WATER_LIGHT,
  type OnaMapStyle,
} from "./palette";

/**
 * Light map (Figma): flat land, white roads with no outline,
 * soft parks, street names only. POIs and transit are hidden so the pros stand out.
 */
export const MAP_STYLES_LIGHT: OnaMapStyle[] = [
  { elementType: "geometry", stylers: [{ color: MAP_LAND_LIGHT }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: MAP_LABEL_LIGHT }] },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ededed" }, { weight: 2 }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d4d4d4" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ visibility: "on" }, { color: MAP_PARK_LIGHT }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: MAP_ROAD_LIGHT }],
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
    stylers: [{ color: MAP_WATER_LIGHT }],
  },
];
