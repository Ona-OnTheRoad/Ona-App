import { useCallback, useEffect, useState } from "react";
import { reverseGeocodeLatLng } from "@/lib/google-maps";
import { knownPlaceToPick, type KnownPlace } from "@/lib/known-places";
import type { PickedLocation } from "../location-picker-map";
import { parseGeocodeResult } from "./parse-geocode-result";

/** Query/busy/status state plus pick, reverse-geocode and GPS actions. */
export function useAddressPick({
  value,
  onChange,
}: {
  value?: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [openSuggest, setOpenSuggest] = useState(false);

  useEffect(() => {
    if (value?.label) setQuery(value.label);
  }, [value?.label]);

  const applyPick = useCallback(
    (picked: PickedLocation) => {
      setQuery(picked.label);
      onChange(picked);
      setOpenSuggest(false);
      setStatus(null);
    },
    [onChange],
  );

  const applyKnown = useCallback(
    (place: KnownPlace) => {
      applyPick(knownPlaceToPick(place));
    },
    [applyPick],
  );

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setBusy(true);
      try {
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
        applyPick({
          lat,
          lng,
          label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          city: "Near you",
          area: "Selected pin",
        });
      } catch {
        setStatus(
          "We could not get the street name. Your location is still saved.",
        );
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

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("Location is not available on this device.");
      return;
    }
    setBusy(true);
    setStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus(null);
        void reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setStatus(
          "Could not read GPS. Type your address and pick a suggestion.",
        );
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5_000 },
    );
  }, [reverseGeocode]);

  return {
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
    useMyLocation,
  };
}
