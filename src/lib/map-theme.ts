/**
 * Map look: satellite imagery with labels (Google "hybrid"; Esri World Imagery on the
 * Leaflet fallback). Custom road styles do not apply to satellite types, so the old
 * dark green / dark red style sheets are no longer used for the live maps.
 *
 * IMPORTANT: Export plain helpers first. Avoid evaluating anything that can
 * throw at module load (that made mapContainerStyle look "not a function"
 * under Turbopack partial init).
 *
 * Never set Google Maps `renderingType` after create unsupported crash.
 */

import {
  MAP_BG_DARK,
  MAP_BG_LIGHT,
  MAP_ROUTE_STROKE,
  OSM_SATELLITE_TILE_URL,
  OSM_SATELLITE_ATTRIBUTION,
  type OnaMapStyle,
} from "./map-theme/palette";
import { MAP_STYLES_DARK } from "./map-theme/styles-dark";
import { MAP_STYLES_LIGHT } from "./map-theme/styles-light";

export { OSM_SATELLITE_ATTRIBUTION };

export {
  MAP_BG_DARK,
  MAP_BG_LIGHT,
  MAP_LABEL_DARK,
  MAP_LABEL_LIGHT,
  MAP_LAND_DARK,
  MAP_LAND_LIGHT,
  MAP_ROAD_DARK,
  MAP_ROAD_DARK_HI,
  MAP_ROAD_LIGHT,
  MAP_ROAD_LIGHT_HI,
  MAP_ROUTE_STROKE,
  MAP_STYLE_REVISION,
  OSM_SATELLITE_TILE_URL,
} from "./map-theme/palette";
export type { OnaMapStyle } from "./map-theme/palette";
export { MAP_STYLES_DARK } from "./map-theme/styles-dark";
export { MAP_STYLES_LIGHT } from "./map-theme/styles-light";

/**
 * GoogleMap mapContainerStyle prop always a real function.
 * Defined early so any import gets a callable even if styles fail below.
 */
export function mapContainerStyle(
  isLight: boolean,
  extra?: Record<string, string | number>,
): Record<string, string | number> {
  return {
    width: "100%",
    height: "100%",
    backgroundColor: isLight ? MAP_BG_LIGHT : MAP_BG_DARK,
    filter: "none",
    opacity: 1,
    ...(extra || {}),
  };
}

export function mapSurfaceStyle(isLight: boolean): {
  backgroundColor: string;
} {
  return {
    backgroundColor: isLight ? MAP_BG_LIGHT : MAP_BG_DARK,
  };
}

export function mapTileChromaKill(): string {
  return "none";
}

export function mapSurfaceFilter(_isLight: boolean): string {
  return "none";
}

export function mapThemeForApp(isLight: boolean): {
  styles: OnaMapStyle[];
  backgroundColor: string;
  osmTileUrl: string;
  osmFilter: string;
} {
  return {
    styles: isLight ? MAP_STYLES_LIGHT : MAP_STYLES_DARK,
    backgroundColor: isLight ? MAP_BG_LIGHT : MAP_BG_DARK,
    osmTileUrl: OSM_SATELLITE_TILE_URL,
    osmFilter: "none",
  };
}

/** Initial GoogleMap options no renderingType (post-create crashes). */
export function mapRenderOptions(isLight: boolean): {
  styles: google.maps.MapTypeStyle[];
  backgroundColor: string;
  mapTypeId: string;
  clickableIcons: boolean;
} {
  const theme = mapThemeForApp(isLight);
  return {
    styles: theme.styles as google.maps.MapTypeStyle[],
    backgroundColor: theme.backgroundColor,
    mapTypeId: "hybrid",
    clickableIcons: false,
  };
}

/**
 * Put a live Google map in satellite ("hybrid") mode. Never touches renderingType.
 * Kept under the old name so every map surface keeps calling it on theme changes.
 */
export function applyOnaMapTheme(map: unknown, isLight: boolean): void {
  if (!map || typeof google === "undefined" || !google.maps) return;
  const gmap = map as google.maps.Map;
  const bg = mapThemeForApp(isLight).backgroundColor;
  try {
    const div = gmap.getDiv?.();
    if (div) {
      div.style.setProperty("filter", "none", "important");
      div.style.setProperty("opacity", "1", "important");
      div.style.backgroundColor = bg;
    }
    gmap.setOptions({ backgroundColor: bg });
    gmap.setMapTypeId(google.maps.MapTypeId.HYBRID);
  } catch {
    /* the map keeps its current type */
  }
}

export function mapThemeForTrackTrip(isLight: boolean): {
  styles: google.maps.MapTypeStyle[];
  backgroundColor: string;
  routeStroke: string;
} {
  const base = mapThemeForApp(isLight);
  return {
    styles: base.styles as google.maps.MapTypeStyle[],
    backgroundColor: base.backgroundColor,
    routeStroke: MAP_ROUTE_STROKE,
  };
}
