import {
  MAP_BG_LIGHT,
  MAP_LABEL_LIGHT,
  MAP_LAND_LIGHT,
  MAP_ROAD_LIGHT,
  MAP_ROAD_LIGHT_HI,
  type OnaMapStyle,
} from "./palette";

/** Light mode: dark green tiles */
export const MAP_STYLES_LIGHT: OnaMapStyle[] = [
  { elementType: "geometry", stylers: [{ color: MAP_LAND_LIGHT }] },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050a08" }, { weight: 3 }],
  },
  { elementType: "labels.text.fill", stylers: [{ color: MAP_LABEL_LIGHT }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a3d2e" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#e8f5ee" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: MAP_ROAD_LIGHT }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0a1610" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: MAP_LABEL_LIGHT }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050a08" }, { weight: 3 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: MAP_ROAD_LIGHT_HI }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f1f16" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#346348" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#274a38" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#06100c" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#12241a" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0c1c14" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: MAP_BG_LIGHT }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: MAP_LAND_LIGHT }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#101e16" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c7d6cd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050a08" }, { weight: 2 }],
  },
  {
    featureType: "poi.attraction",
    elementType: "labels.text.fill",
    stylers: [{ color: "#eaf4ef" }],
  },
  {
    featureType: "poi.attraction",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050a08" }, { weight: 2 }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b9c8c0" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050a08" }, { weight: 2 }],
  },
];
