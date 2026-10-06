/**
 * Customer map theme dark green (light mode) / dark red (black mode).
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
  OSM_DARK_TILE_URL,
  type OnaMapStyle,
} from "./map-theme/palette";
import { MAP_STYLES_DARK } from "./map-theme/styles-dark";
import { MAP_STYLES_LIGHT } from "./map-theme/styles-light";

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
  OSM_DARK_TILE_URL,
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
    osmTileUrl: OSM_DARK_TILE_URL,
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
 * Apply dark-green / dark-red styles on a live map.
 * Never touches renderingType.
 */
export function applyOnaMapTheme(map: unknown, isLight: boolean): void {
  if (!map || typeof google === "undefined" || !google.maps) return;
  const gmap = map as google.maps.Map;
  const theme = mapThemeForApp(isLight);
  const typeId = isLight ? "ona_safe_green_v7" : "ona_safe_red_v7";
  const bg = theme.backgroundColor;

  try {
    const div = gmap.getDiv?.();
    if (div) {
      div.style.setProperty("filter", "none", "important");
      div.style.setProperty("opacity", "1", "important");
      div.style.backgroundColor = bg;
    }
  } catch {
    /* ignore */
  }

  try {
    const styles = theme.styles as google.maps.MapTypeStyle[];
    gmap.setOptions({
      styles,
      backgroundColor: bg,
    });
  } catch {
    /* ignore */
  }

  try {
    const styles = theme.styles as google.maps.MapTypeStyle[];
    if (typeof google.maps.StyledMapType === "function") {
      const styled = new google.maps.StyledMapType(styles, {
        name: isLight ? "Ona Dark Green" : "Ona Dark Red",
        alt: isLight ? "Dark green map" : "Dark red map",
      });
      gmap.mapTypes.set(typeId, styled);
      gmap.setMapTypeId(typeId as google.maps.MapTypeId);
      gmap.setOptions({
        styles,
        backgroundColor: bg,
      });
    } else {
      gmap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
    }
  } catch {
    try {
      const styles = theme.styles as google.maps.MapTypeStyle[];
      gmap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      gmap.setOptions({
        styles,
        backgroundColor: bg,
      });
    } catch {
      /* ignore */
    }
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
