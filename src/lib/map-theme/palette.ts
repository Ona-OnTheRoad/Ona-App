/* ─── Palette (from the Figma map designs) ─── */
/** Light theme: soft grey land, white roads, pale green parks. */
export const MAP_BG_LIGHT = "#ededed";
export const MAP_LAND_LIGHT = "#ededed";
export const MAP_ROAD_LIGHT = "#ffffff";
export const MAP_ROAD_LIGHT_HI = "#ffffff";
export const MAP_LABEL_LIGHT = "#111111";
export const MAP_PARK_LIGHT = "#bfe6cc";
export const MAP_WATER_LIGHT = "#cfe0ec";

/** Dark theme: deep green-black land, near-black roads. */
export const MAP_BG_DARK = "#0c1815";
export const MAP_LAND_DARK = "#0c1815";
export const MAP_ROAD_DARK = "#060808";
export const MAP_ROAD_DARK_HI = "#060808";
export const MAP_LABEL_DARK = "#d9dfdc";
export const MAP_PARK_DARK = "#17231f";
export const MAP_WATER_DARK = "#08110f";

/**
 * Richer neighbourhood detail (same flat look, more context):
 * side streets, area names and a few landmark names are visible, not only main roads.
 */
export const MAP_ROAD_LOCAL_DARK = "#1c2b26";
export const MAP_ROAD_ARTERIAL_DARK = "#263832";
export const MAP_ROAD_HIGHWAY_DARK = "#31463f";
export const MAP_AREA_LABEL_DARK = "#ffffff";
export const MAP_SIDE_STREET_LABEL_DARK = "#9fb0a9";
export const MAP_LANDMARK_LABEL_DARK = "#8fa39b";

export const MAP_ROAD_LOCAL_LIGHT = "#fbfbfb";
export const MAP_AREA_LABEL_LIGHT = "#000000";
export const MAP_SIDE_STREET_LABEL_LIGHT = "#4b5563";
export const MAP_LANDMARK_LABEL_LIGHT = "#5b6472";

export const MAP_STYLE_REVISION = "map-theme-figma-v10";

/**
 * Leaflet fallback tiles: CARTO Positron / Dark Matter (OpenStreetMap data), the
 * closest raster match to the Google styles above. Attribution is required.
 */
export const OSM_TILE_URL_LIGHT =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const OSM_TILE_URL_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const OSM_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

export const MAP_ROUTE_STROKE = "#FF6B35";

/** Map style entries (compatible with google.maps.MapTypeStyle) */
export type OnaMapStyle = {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number | boolean>>;
};
