import { useCallback, useEffect, useState, type RefObject } from "react";
import { reverseGeocodeLatLng } from "@/lib/google-maps";
import { DEFAULT_USER_LOCATION } from "@/lib/data/technicians";
import { knownPlaceToPick, type KnownPlace } from "@/lib/known-places";
import { parseGeocodeResult } from "./parse-geocode-result";
import type { PickedLocation } from "./types";

/** Pin, query, status state and the pin/GPS/reverse-geocode actions. */
export function usePickerPin({
  value,
  onChange,
  mapRef,
}: {
  value?: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  mapRef: RefObject<google.maps.Map | null>;
}) {
  const [center, setCenter] = useState({
    lat: value?.lat ?? DEFAULT_USER_LOCATION.coordinates.lat,
    lng: value?.lng ?? DEFAULT_USER_LOCATION.coordinates.lng,
  });
  const [pin, setPin] = useState(center);
  const [query, setQuery] = useState(value?.label ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [openSuggest, setOpenSuggest] = useState(false);

  const applyPick = useCallback(
    (picked: PickedLocation, zoom = 16) => {
      setPin({ lat: picked.lat, lng: picked.lng });
      setCenter({ lat: picked.lat, lng: picked.lng });
      mapRef.current?.panTo({ lat: picked.lat, lng: picked.lng });
      mapRef.current?.setZoom(zoom);
      setQuery(picked.label);
      onChange(picked);
      setOpenSuggest(false);
      setStatus(null);
    },
    [onChange, mapRef],
  );

  const applyKnown = useCallback(
    (place: KnownPlace) => {
      applyPick(knownPlaceToPick(place), 17);
      setStatus(`${place.name} · pinned`);
    },
    [applyPick],
  );

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setBusy(true);
      try {
        // Always real reverse-geocode for pins / GPS never snap to curated POI
        const rest = await reverseGeocodeLatLng(lat, lng);
        if (rest) {
          applyPick({
            lat,
            lng,
            label: rest.label,
            city: rest.city,
            area: rest.area,
          });
          return;
        }
        if (window.google?.maps) {
          const geocoder = new google.maps.Geocoder();
          const { results } = await geocoder.geocode({
            location: { lat, lng },
          });
          if (results?.[0]) {
            applyPick(parseGeocodeResult(results[0], lat, lng));
            return;
          }
        }
        const fallback: PickedLocation = {
          lat,
          lng,
          label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          city: "Near you",
          area: "Selected pin",
        };
        applyPick(fallback);
        setStatus("Pin saved. Street name could not be loaded yet.");
      } catch {
        setStatus("We could not get the street name. Your pin is still saved.");
        onChange({
          lat,
          lng,
          label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          city: "Near you",
          area: "Selected pin",
        });
      } finally {
        setBusy(false);
      }
    },
    [applyPick, onChange],
  );

  const placePin = useCallback(
    (lat: number, lng: number, geocode = true) => {
      setPin({ lat, lng });
      setCenter({ lat, lng });
      mapRef.current?.panTo({ lat, lng });
      if (geocode) void reverseGeocode(lat, lng);
    },
    [reverseGeocode, mapRef],
  );

  const goToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("GPS not available on this device");
      return;
    }
    setBusy(true);
    setStatus("Getting live GPS…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        placePin(lat, lng, true);
        setBusy(false);
      },
      () => {
        setStatus("We could not get live location. Move the pin or search.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5_000 },
    );
  }, [placePin]);

  // Initial GPS once
  useEffect(() => {
    if (!value) {
      goToMyLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value?.label) setQuery(value.label);
    if (value?.lat && value?.lng) {
      setPin({ lat: value.lat, lng: value.lng });
      setCenter({ lat: value.lat, lng: value.lng });
    }
  }, [value?.lat, value?.lng, value?.label]);

  return {
    center,
    pin,
    query,
    setQuery,
    busy,
    setBusy,
    status,
    setStatus,
    openSuggest,
    setOpenSuggest,
    applyPick,
    applyKnown,
    reverseGeocode,
    placePin,
    goToMyLocation,
  };
}
