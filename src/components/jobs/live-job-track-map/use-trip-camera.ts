import { useCallback, useEffect, useRef } from "react";
import { applyOnaMapTheme, mapRenderOptions } from "@/lib/map-theme";

type LatLng = { lat: number; lng: number };

/** Camera/theme handling for the trip map: first auto-fit only, never steal the camera after the user moves it. */
export function useTripCamera({
  proPos,
  motoristPos,
  isLight,
  isLoaded,
}: {
  proPos: LatLng | null;
  motoristPos: LatLng;
  isLight: boolean;
  isLoaded: boolean;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  /** Once user pans/zooms, never auto fitBounds / pan back. */
  const userHasMovedMapRef = useRef(false);
  /** First auto-frame only (pins visible). */
  const didInitialFitRef = useRef(false);
  /** Ignore zoom_changed fired by our own fitBounds. */
  const programmaticCameraRef = useRef(false);

  /**
   * Stable initial center only live GPS must NOT update the GoogleMap `center`
   * prop or React will snap the viewport every pro location tick.
   */
  const initialCenterRef = useRef({
    lat: proPos ? (proPos.lat + motoristPos.lat) / 2 : motoristPos.lat,
    lng: proPos ? (proPos.lng + motoristPos.lng) / 2 : motoristPos.lng,
  });

  const fitTripIfAllowed = useCallback(
    (map?: google.maps.Map | null) => {
      const m = map ?? mapRef.current;
      // Never re-frame after first auto-fit or after the user takes the camera.
      if (!m || userHasMovedMapRef.current || didInitialFitRef.current) return;
      try {
        programmaticCameraRef.current = true;
        if (proPos) {
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(proPos);
          bounds.extend(motoristPos);
          m.fitBounds(bounds, 56);
          didInitialFitRef.current = true;
        } else {
          m.panTo(motoristPos);
          m.setZoom(16);
          didInitialFitRef.current = true;
        }
        window.setTimeout(() => {
          programmaticCameraRef.current = false;
        }, 400);
      } catch {
        programmaticCameraRef.current = false;
      }
    },
    [proPos, motoristPos],
  );

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      applyOnaMapTheme(map, isLight);
      map.setOptions({
        ...mapRenderOptions(isLight),
        draggable: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        gestureHandling: "greedy",
      });

      // User drag / pinch-zoom / zoom control → free camera (stop auto-reset).
      map.addListener("dragstart", () => {
        userHasMovedMapRef.current = true;
      });
      map.addListener("zoom_changed", () => {
        if (programmaticCameraRef.current) return;
        if (didInitialFitRef.current) {
          userHasMovedMapRef.current = true;
        }
      });

      const bump = () => {
        try {
          google.maps.event.trigger(map, "resize");
        } catch {
          /* ignore */
        }
        fitTripIfAllowed(map);
      };
      bump();
      window.setTimeout(bump, 80);
      window.setTimeout(bump, 320);
    },
    [isLight, fitTripIfAllowed],
  );

  // Keep palette + street names in sync on theme toggle (no camera steal).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    applyOnaMapTheme(map, isLight);
  }, [isLoaded, isLight]);

  return { initialCenterRef, fitTripIfAllowed, onLoad };
}
