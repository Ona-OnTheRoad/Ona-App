"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { shouldUseLiveMaps } from "@/lib/google-maps";
import { useOnaGoogleMaps } from "@/lib/google-maps-loader";
import { applyOnaMapTheme, mapRenderOptions } from "@/lib/map-theme";
import { useApp } from "@/lib/store";

const OsmMap = dynamic(() => import("./address-osm-map"), {
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
  const [googleFailed, setGoogleFailed] = useState(false);

  useEffect(() => {
    if (mapRef.current) {
      applyOnaMapTheme(mapRef.current, isLight);
    }
  }, [isLight]);

  // Smoothly pan map when pin changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: pin.lat, lng: pin.lng });
    }
  }, [pin.lat, pin.lng]);

  if (!live || loadError || googleFailed) {
    return <OsmMap pin={pin} onPinChange={onPinChange} />;
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-ona-field text-[12px] text-ona-muted">
        Loading live map…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
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
  );
}
