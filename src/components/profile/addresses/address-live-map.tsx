"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { MapPinOff, RefreshCw } from "lucide-react";
import { shouldUseLiveMaps } from "@/lib/google-maps";
import { useOnaGoogleMaps } from "@/lib/google-maps-loader";
import { applyOnaMapTheme, mapRenderOptions } from "@/lib/map-theme";
import { useApp } from "@/lib/store";

interface AddressOsmMapProps {
  pin: { lat: number; lng: number };
  onPinChange: (lat: number, lng: number) => void;
  isLight?: boolean;
  onError?: () => void;
}

const OsmMap = dynamic<AddressOsmMapProps>(() => import("./address-osm-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ona-field text-[12px] text-ona-muted">
      Loading map…
    </div>
  ),
});

const RED_PIN_SVG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.2">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.8" fill="#FFFFFF"/>
  </svg>`
)}`;

class GoogleMapErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface AddressLiveMapProps {
  pin: { lat: number; lng: number };
  onPinChange: (lat: number, lng: number) => void;
}

export function AddressLiveMap({ pin, onPinChange }: AddressLiveMapProps) {
  const { theme } = useApp();
  const isLight = theme === "light";
  const live = shouldUseLiveMaps();
  const { isLoaded, loadError } = useOnaGoogleMaps();

  const mapRef = useRef<google.maps.Map | null>(null);
  const [googleFailed, setGoogleFailed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("om_google_maps_failed") === "1";
    } catch {
      return false;
    }
  });
  const [osmFailed, setOsmFailed] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  // Catch Google billing, referrer restrictions, or auth errors
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & { gm_authFailure?: () => void };
    const prev = w.gm_authFailure;
    w.gm_authFailure = () => {
      setGoogleFailed(true);
      try {
        sessionStorage.setItem("om_google_maps_failed", "1");
      } catch {
        /* ignore */
      }
      prev?.();
    };
    return () => {
      w.gm_authFailure = prev;
    };
  }, []);

  // Graceful timeout: if Google script takes > 6s to load, switch to OSM
  useEffect(() => {
    if (!live || isLoaded || googleFailed) return;
    const timer = window.setTimeout(() => {
      if (!isLoaded) {
        setGoogleFailed(true);
      }
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [live, isLoaded, googleFailed]);

  // Apply Ona map theme on light/dark mode switch
  useEffect(() => {
    if (mapRef.current) {
      applyOnaMapTheme(mapRef.current, isLight);
    }
  }, [isLight]);

  // Smoothly pan Google map when pin changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: pin.lat, lng: pin.lng });
    }
  }, [pin.lat, pin.lng]);

  const handleRetry = () => {
    try {
      sessionStorage.removeItem("om_google_maps_failed");
    } catch {
      /* ignore */
    }
    setGoogleFailed(false);
    setOsmFailed(false);
    setRetryTick((t) => t + 1);
  };

  const isGoogleDown = !live || Boolean(loadError) || googleFailed;

  // 1. Both maps failed (or device offline) -> Show polished error UI
  if (isGoogleDown && osmFailed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-5 text-center bg-ona-field/70 dark:bg-ona-field/30 select-none">
        <div className="h-11 w-11 rounded-2xl bg-[#F05A30]/10 flex items-center justify-center text-[#F05A30] shadow-2xs mb-2.5">
          <MapPinOff className="h-5 w-5" strokeWidth={2} />
        </div>
        <h4 className="text-[13px] font-semibold text-ona-ink">Map Preview Unavailable</h4>
        <p className="mt-0.5 text-[11px] text-ona-muted max-w-[260px] leading-relaxed">
          Unable to connect to live map services. Your selected pin and address coordinates are still saved securely.
        </p>
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-ona-border/70 bg-ona-surface px-2.5 py-1 text-[10.5px] font-medium text-ona-ink shadow-2xs">
          <span className="text-[#F05A30]">📍</span>
          <span>
            {pin.lat.toFixed(5)}°, {pin.lng.toFixed(5)}°
          </span>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#F05A30] px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-[#E04D24] active:scale-98 transition-all cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry Map</span>
        </button>
      </div>
    );
  }

  // 2. Google Maps unavailable -> Fallback to OpenStreetMap
  if (isGoogleDown) {
    return (
      <div className="relative h-full w-full">
        <OsmMap
          key={`osm-${retryTick}`}
          pin={pin}
          onPinChange={onPinChange}
          isLight={isLight}
          onError={() => setOsmFailed(true)}
        />
        <div className="pointer-events-none absolute bottom-2 left-2 z-40 rounded-md bg-black/60 px-2 py-0.5 text-[9.5px] font-medium text-white/90 backdrop-blur-xs">
          OpenStreetMap
        </div>
      </div>
    );
  }

  // 3. Google Maps still loading
  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-ona-field text-[12px] text-ona-muted">
        Loading live map…
      </div>
    );
  }

  // 4. Google Maps live
  return (
    <GoogleMapErrorBoundary onError={() => setGoogleFailed(true)}>
      <div className="relative h-full w-full">
        <GoogleMap
          key={`gmap-${retryTick}`}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={{ lat: pin.lat, lng: pin.lng }}
          zoom={16}
          onLoad={(map) => {
            mapRef.current = map;
            applyOnaMapTheme(map, isLight);
          }}
          onClick={(e) => {
            const lat = e.latLng?.lat();
            const lng = e.latLng?.lng();
            if (lat != null && lng != null) {
              onPinChange(lat, lng);
            }
          }}
          options={{
            ...mapRenderOptions(isLight),
            disableDefaultUI: true,
            zoomControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            gestureHandling: "greedy",
          }}
        >
          <Marker
            position={{ lat: pin.lat, lng: pin.lng }}
            draggable
            icon={
              typeof window !== "undefined" && window.google?.maps
                ? {
                    url: RED_PIN_SVG,
                    scaledSize: new window.google.maps.Size(36, 36),
                    anchor: new window.google.maps.Point(18, 36),
                  }
                : undefined
            }
            onDragEnd={(e) => {
              const lat = e.latLng?.lat();
              const lng = e.latLng?.lng();
              if (lat != null && lng != null) {
                onPinChange(lat, lng);
              }
            }}
          />
        </GoogleMap>
      </div>
    </GoogleMapErrorBoundary>
  );
}
