/* ─── Palette ─── */
export const MAP_BG_LIGHT = "#0a1610";
export const MAP_LAND_LIGHT = "#0f1f16";
export const MAP_ROAD_LIGHT = "#2d5540";
export const MAP_ROAD_LIGHT_HI = "#3d7054";
export const MAP_LABEL_LIGHT = "#f0f7f3";

export const MAP_BG_DARK = "#0a0000";
export const MAP_LAND_DARK = "#1a0808";
export const MAP_ROAD_DARK = "#4d2222";
export const MAP_ROAD_DARK_HI = "#6e3030";
export const MAP_LABEL_DARK = "#fff0f0";

export const MAP_STYLE_REVISION = "map-theme-labels-v8";

export const OSM_DARK_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export const MAP_ROUTE_STROKE = "#FF6B35";

/** Map style entries (compatible with google.maps.MapTypeStyle) */
export type OnaMapStyle = {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number | boolean>>;
};
