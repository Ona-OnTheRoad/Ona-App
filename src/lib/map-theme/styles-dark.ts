import {
  MAP_BG_DARK,
  MAP_LABEL_DARK,
  MAP_LAND_DARK,
  MAP_ROAD_DARK,
  MAP_ROAD_DARK_HI,
  type OnaMapStyle,
} from "./palette";

/** Black mode: dark red tiles */
export const MAP_STYLES_DARK: OnaMapStyle[] = [
  { elementType: "geometry", stylers: [{ color: MAP_LAND_DARK }] },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050000" }, { weight: 3 }],
  },
  { elementType: "labels.text.fill", stylers: [{ color: MAP_LABEL_DARK }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3d1515" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffe8e8" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: MAP_ROAD_DARK }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#120606" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: MAP_LABEL_DARK }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050000" }, { weight: 3 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: MAP_ROAD_DARK_HI }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a0808" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#5a2828" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#42201c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#080000" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1f0a0a" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#160606" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: MAP_BG_DARK }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: MAP_LAND_DARK }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#140606" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d8c9b5" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050000" }, { weight: 2 }],
  },
  {
    featureType: "poi.attraction",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffe8d6" }],
  },
  {
    featureType: "poi.attraction",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050000" }, { weight: 2 }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cfbfa8" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#050000" }, { weight: 2 }],
  },
];
