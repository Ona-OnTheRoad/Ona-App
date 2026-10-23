"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface AddressOsmMapProps {
  pin: { lat: number; lng: number };
  onPinChange: (lat: number, lng: number) => void;
}

function MapEvents({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapCenterSync({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 16, { animate: true });
  }, [map, center.lat, center.lng]);
  return null;
}

export default function AddressOsmMap({ pin, onPinChange }: AddressOsmMapProps) {
  const redPinIcon = useMemo(() => {
    return L.divIcon({
      className: "ona-red-drop-pin",
      html: `<div style="width:36px;height:36px;margin-left:-18px;margin-top:-36px;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.35));cursor:pointer;">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.8" fill="#FFFFFF"/>
        </svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[pin.lat, pin.lng]}
        zoom={16}
        scrollWheelZoom={false}
        zoomControl={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onPick={onPinChange} />
        <MapCenterSync center={pin} />
        <Marker
          position={[pin.lat, pin.lng]}
          icon={redPinIcon}
          draggable
          eventHandlers={{
            dragend(e) {
              const marker = e.target;
              const pos = marker.getLatLng();
              onPinChange(pos.lat, pos.lng);
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
