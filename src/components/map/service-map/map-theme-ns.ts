import * as mapTheme from "@/lib/map-theme";

/** Namespace import avoids Turbopack named-export partial-init glitches */
export const {
  MAP_STYLE_REVISION,
  applyOnaMapTheme,
  mapContainerStyle,
  mapRenderOptions,
  mapSurfaceStyle,
  mapThemeForApp,
} = mapTheme;

export function safeMapContainerStyle(
  isLight: boolean,
): Record<string, string | number> {
  if (typeof mapContainerStyle === "function") {
    return mapContainerStyle(isLight);
  }
  // Hard fallback if module init was partial (must never crash the app shell)
  return {
    width: "100%",
    height: "100%",
    backgroundColor: isLight ? "#0a1610" : "#0a0000",
  };
}
