/**
 * Ona map look (from the Figma designs): a flat, light map in light mode and a deep
 * green-black map in dark mode, styled through Google's roadmap type. The Leaflet
 * fallback uses CARTO Positron / Dark Matter tiles to match.
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
  OSM_ATTRIBUTION,
  OSM_TILE_URL_DARK,
  OSM_TILE_URL_LIGHT,
  type OnaMapStyle,
} from "./map-theme/palette";
import { MAP_STYLES_DARK } from "./map-theme/styles-dark";
import { MAP_STYLES_LIGHT } from "./map-theme/styles-light";

export { OSM_ATTRIBUTION };

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
  OSM_TILE_URL_DARK,
  OSM_TILE_URL_LIGHT,
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
    osmTileUrl: isLight ? OSM_TILE_URL_LIGHT : OSM_TILE_URL_DARK,
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
    mapTypeId: "roadmap",
    clickableIcons: false,
  };
}

/**
 * Put a live Google map on the styled roadmap type and set its background.
 * Kept under the old name so every map surface keeps calling it on theme changes.
 * Never touches renderingType.
 */
export function applyOnaMapTheme(map: unknown, isLight: boolean): void {
  if (!map || typeof google === "undefined" || !google.maps) return;
  const gmap = map as google.maps.Map;
  const theme = mapThemeForApp(isLight);
  try {
    const div = gmap.getDiv?.();
    if (div) {
      div.style.setProperty("filter", "none", "important");
      div.style.setProperty("opacity", "1", "important");
      div.style.backgroundColor = theme.backgroundColor;
    }
    gmap.setOptions({
      backgroundColor: theme.backgroundColor,
      styles: theme.styles as google.maps.MapTypeStyle[],
    });
    gmap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
  } catch {
    /* the map keeps its current look */
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
