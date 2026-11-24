import { neighbourhoodStyles } from "./neighbourhood";
import {
  MAP_AREA_LABEL_DARK,
  MAP_LANDMARK_LABEL_DARK,
  MAP_ROAD_ARTERIAL_DARK,
  MAP_ROAD_HIGHWAY_DARK,
  MAP_ROAD_LOCAL_DARK,
  MAP_SIDE_STREET_LABEL_DARK,
  MAP_LABEL_DARK,
  MAP_LAND_DARK,
  MAP_PARK_DARK,
  MAP_ROAD_DARK,
  MAP_WATER_DARK,
  type OnaMapStyle,
} from "./palette";

/**
 * Dark map (Figma): flat land, near-black roads with no outline,
 * soft parks. Shops/transit stay hidden so the pros stand out; area names, side streets
 * and a few landmark names are shown for neighbourhood context.
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
  ...neighbourhoodStyles({
    areaLabel: MAP_AREA_LABEL_DARK,
    sideStreetLabel: MAP_SIDE_STREET_LABEL_DARK,
    landmarkLabel: MAP_LANDMARK_LABEL_DARK,
    localRoad: MAP_ROAD_LOCAL_DARK,
    arterialRoad: MAP_ROAD_ARTERIAL_DARK,
    highwayRoad: MAP_ROAD_HIGHWAY_DARK,
  }),
];
