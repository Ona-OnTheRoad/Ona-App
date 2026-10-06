import type { RefObject } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Crosshair, Navigation } from "lucide-react";
import { MapTintOverlay } from "@/components/map/map-tint-overlay";
import {
  MAP_STYLE_REVISION,
  applyOnaMapTheme,
  mapContainerStyle as onaMapContainerStyle,
  mapRenderOptions,
  mapThemeForApp,
} from "@/lib/map-theme";
import { cn } from "@/lib/utils";

type Props = {
  mapRef: RefObject<google.maps.Map | null>;
  mapH: string;
  isLight: boolean;
  mapTheme: ReturnType<typeof mapThemeForApp>;
  center: { lat: number; lng: number };
  pin: { lat: number; lng: number };
  query: string;
  busy: boolean;
  placePin: (lat: number, lng: number, geocode?: boolean) => void;
  goToMyLocation: () => void;
};

/** Google map surface: pin, tint overlay, "My location" and hint chip. */
export function PickerMapSurface({
  mapRef,
  mapH,
  isLight,
  mapTheme,
  center,
  pin,
  query,
  busy,
  placePin,
  goToMyLocation,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-black/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]",
        mapH,
      )}
      data-map-surface
      data-map-engine="google"
      data-map-theme={isLight ? "light" : "dark"}
      data-map-rev={MAP_STYLE_REVISION}
      style={{ backgroundColor: mapTheme.backgroundColor }}
    >
      <GoogleMap
        key={`pick-${MAP_STYLE_REVISION}-${isLight ? "light" : "dark"}`}
        mapContainerStyle={onaMapContainerStyle(isLight, {
          backgroundColor: mapTheme.backgroundColor,
        })}
        center={center}
        zoom={16}
        onLoad={(map) => {
          mapRef.current = map;
          applyOnaMapTheme(map, isLight);
        }}
        onClick={(e) => {
          const lat = e.latLng?.lat();
          const lng = e.latLng?.lng();
          if (lat == null || lng == null) return;
          placePin(lat, lng, true);
        }}
        options={{
          ...mapRenderOptions(isLight),
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          minZoom: 12,
          maxZoom: 19,
        }}
      >
        <Marker
          position={pin}
          draggable
          title={query || "Selected location"}
          onDragEnd={(e) => {
            const lat = e.latLng?.lat();
            const lng = e.latLng?.lng();
            if (lat == null || lng == null) return;
            placePin(lat, lng, true);
          }}
        />
      </GoogleMap>
      <MapTintOverlay isLight={isLight} />

      <button
        type="button"
        onClick={goToMyLocation}
        disabled={busy}
        className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-md border-0 bg-[#323231] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md active:opacity-90 disabled:opacity-60"
      >
        <Navigation className="h-3.5 w-3.5" strokeWidth={2.4} />
        My location
      </button>
      <div className="pointer-events-none absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
        <Crosshair className="h-3 w-3" />
        Tap map or drag pin
      </div>
    </div>
  );
}
