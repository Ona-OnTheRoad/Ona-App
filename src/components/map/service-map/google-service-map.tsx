import { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { LiveProPin } from "@/components/map/live-pro-pin";
import { MAP_NEAR_ZOOM } from "@/lib/matching";
import { DEFAULT_USER_LOCATION } from "@/lib/data/user-location";
import {
  USER_MAP_PIN_ANCHOR,
  USER_MAP_PIN_SIZE,
  userMapPinUrl,
} from "@/lib/map-user-pin";
import { useApp } from "@/lib/store";
import type { Technician } from "@/lib/types";
import {
  MAP_STYLE_REVISION,
  applyOnaMapTheme,
  mapRenderOptions,
  mapSurfaceStyle,
  safeMapContainerStyle,
} from "./map-theme-ns";
import { NearbyCountBadge } from "./nearby-count-badge";

/**
 * Homepage map: force Google Maps when a live key is present.
 * OpenStreetMap only if the key is missing or Google hard-fails this session.
 */
export function GoogleServiceMap({
  technicians,
  onSelect,
  onFatalError,
}: {
  technicians: Technician[];
  onSelect?: (id: string) => void;
  onFatalError?: () => void;
}) {
  const { location, selectedTechId, theme } = useApp();
  const isLight = theme === "light";
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const center = useMemo(
    () => ({
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
    }),
    [location.coordinates.lat, location.coordinates.lng],
  );

  const onLoad = useCallback(
    (m: google.maps.Map) => {
      // Deep force: styles + grayscale chroma-kill (no sepia/orange)
      applyOnaMapTheme(m, isLight);
      window.requestAnimationFrame(() => applyOnaMapTheme(m, isLight));
      // Re-paint after Google finishes first tile pass (kills late orange roads)
      const t1 = window.setTimeout(() => applyOnaMapTheme(m, isLight), 400);
      const t2 = window.setTimeout(() => applyOnaMapTheme(m, isLight), 1200);
      setMap(m);
      let checks = 0;
      const id = window.setInterval(() => {
        checks += 1;
        if (
          document.querySelector(".gm-err-container") ||
          document.querySelector(".gm-err-message")
        ) {
          window.clearInterval(id);
          onFatalError?.();
        } else if (checks >= 10) {
          window.clearInterval(id);
        }
      }, 200);
      const bag = m as google.maps.Map & {
        __omTimer?: number;
        __omPaint?: number[];
      };
      bag.__omTimer = id;
      bag.__omPaint = [t1, t2];
    },
    [onFatalError, isLight],
  );

  const onUnmount = useCallback(() => {
    if (map) {
      const bag = map as google.maps.Map & {
        __omTimer?: number;
        __omPaint?: number[];
      };
      if (bag.__omTimer) window.clearInterval(bag.__omTimer);
      bag.__omPaint?.forEach((t) => window.clearTimeout(t));
    }
    setMap(null);
  }, [map]);

  // Re-apply green/red (CSS filter + styles) when theme flips
  useEffect(() => {
    if (!map) return;
    applyOnaMapTheme(map, isLight);
  }, [map, isLight]);

  // Only pros with a real live GPS pin on the map
  const livePros = technicians.filter(
    (t) =>
      t.hasLiveLocation !== false &&
      Number.isFinite(t.location.lat) &&
      Number.isFinite(t.location.lng) &&
      !(t.location.lat === 0 && t.location.lng === 0),
  );

  // Deep view: fit you + each pro’s live coordinates
  useEffect(() => {
    if (!map || typeof google === "undefined") return;
    const isPlaceholderCenter =
      Math.abs(center.lat - DEFAULT_USER_LOCATION.coordinates.lat) < 0.0001 &&
      Math.abs(center.lng - DEFAULT_USER_LOCATION.coordinates.lng) < 0.0001;

    if (livePros.length === 0) {
      map.panTo(center);
      // Street names need ~16+ zoom (Uber/inDrive density)
      map.setZoom(Math.max(MAP_NEAR_ZOOM + 1, 16));
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    // Do not stretch bounds to placeholder Marina coordinates if user GPS hasn't resolved yet
    if (!isPlaceholderCenter) {
      bounds.extend(center);
    }
    livePros.forEach((t) =>
      bounds.extend({ lat: t.location.lat, lng: t.location.lng }),
    );
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 56, right: 40, bottom: 40, left: 40 });
    } else {
      map.panTo(center);
    }
    // Street-level: don't zoom out so far that names disappear
    const z = map.getZoom();
    if (z != null && z > 18) map.setZoom(18);
    if (z != null && z < 15) map.setZoom(15);
  }, [map, center.lat, center.lng, livePros]);

  const mapOptions = useMemo(
    () => ({
      ...mapRenderOptions(isLight),
      disableDefaultUI: true,
      zoomControl: false,
      gestureHandling: "greedy" as const,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      maxZoom: 19,
      minZoom: 12,
    }),
    [isLight],
  );

  return (
    <div
      data-map-surface
      data-map-engine="google"
      data-map-theme={isLight ? "light" : "dark"}
      data-map-rev={MAP_STYLE_REVISION}
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: mapSurfaceStyle(isLight).backgroundColor,
        // Never dim the home map shell
        opacity: 1,
        filter: "none",
      }}
    >
      <NearbyCountBadge count={livePros.length} />
      <GoogleMap
        key={`gm-${MAP_STYLE_REVISION}-${isLight ? "light" : "dark"}`}
        mapContainerStyle={safeMapContainerStyle(isLight)}
        mapContainerClassName="ona-home-map-visible"
        center={center}
        zoom={16}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        <Marker
          position={center}
          icon={{
            url: userMapPinUrl(USER_MAP_PIN_SIZE),
            scaledSize:
              typeof google !== "undefined"
                ? new google.maps.Size(USER_MAP_PIN_SIZE, USER_MAP_PIN_SIZE)
                : undefined,
            anchor:
              typeof google !== "undefined"
                ? new google.maps.Point(
                    USER_MAP_PIN_ANCHOR,
                    USER_MAP_PIN_ANCHOR,
                  )
                : undefined,
          }}
          title={`You: ${location.label}`}
          zIndex={500}
        />
        {livePros.map((t) => {
          const selected = t.id === selectedTechId;
          return (
            <LiveProPin
              key={`${t.id}-${t.location.lat.toFixed(5)}-${t.location.lng.toFixed(5)}`}
              tech={t}
              selected={selected}
              onSelect={onSelect}
            />
          );
        })}
      </GoogleMap>
      {/* No tint overlay real styled tiles only (full visibility + gestures) */}
    </div>
  );
}
