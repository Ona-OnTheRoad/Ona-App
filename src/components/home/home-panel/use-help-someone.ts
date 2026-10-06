"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KnownPlace } from "@/lib/known-places";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { geocodeAddress } from "@/components/home/home-panel/geocode-address";

/**
 * "Helping someone else" top strip: address field state, Places Autocomplete
 * binding and the Nominatim / curated-places fallback.
 */
export function useHelpSomeone({
  isMotorist,
  mapsLoaded,
  liveMaps,
}: {
  isMotorist: boolean;
  mapsLoaded: boolean;
  liveMaps: boolean;
}) {
  const t = useT();
  const {
    setManualLocation,
    refreshNearbyPros,
    setHelpingSomeoneElse,
    retryLocation,
  } = useApp();
  /** Only the top strip swaps; list / radius / filters stay */
  const [helpMode, setHelpMode] = useState(false);
  const [helpAddress, setHelpAddress] = useState("");
  const [helpBusy, setHelpBusy] = useState(false);
  const [helpError, setHelpError] = useState<string | null>(null);
  const [helpKnownHits, setHelpKnownHits] = useState<KnownPlace[]>([]);
  const [helpSuggestOpen, setHelpSuggestOpen] = useState(false);
  const helpInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const applyPlaceRef = useRef<
    (label: string, lat: number, lng: number) => void
  >(() => {});

  useEffect(() => {
    if (!isMotorist && helpMode) setHelpMode(false);
  }, [isMotorist, helpMode]);

  const openHelpSomeone = () => {
    if (!isMotorist) return;
    setHelpMode(true);
    setHelpError(null);
    // Focus after paint so keyboard + Places attach cleanly
    window.setTimeout(() => helpInputRef.current?.focus(), 80);
  };

  const closeHelpMode = () => {
    setHelpMode(false);
    setHelpError(null);
  };

  const applyHelpLocation = useCallback(
    (label: string, lat: number, lng: number) => {
      const coordinates = { lat, lng };
      setHelpingSomeoneElse({ label, coordinates });
      setManualLocation(label, coordinates);
      refreshNearbyPros();
      setHelpAddress(label);
      setHelpError(null);
      // Stay in help mode: address on top, trades reappear below (no chip)
    },
    [setHelpingSomeoneElse, setManualLocation, refreshNearbyPros],
  );

  applyPlaceRef.current = applyHelpLocation;

  // Google Places Autocomplete worldwide (Uber-style suggestions)
  useEffect(() => {
    if (!helpMode || !mapsLoaded || !liveMaps) return;
    if (!helpInputRef.current) return;
    if (!window.google?.maps?.places) return;

    // Re-bind when reopening help mode
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    try {
      const ac = new google.maps.places.Autocomplete(helpInputRef.current, {
        fields: ["formatted_address", "geometry", "name", "place_id"],
        // Worldwide no country restriction
        types: ["geocode"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const loc = place.geometry?.location;
        if (!loc) {
          setHelpError(t("home.pickSuggestion"));
          return;
        }
        const lat = loc.lat();
        const lng = loc.lng();
        // Google suggestion → real address only (curated POI via typed search suggestions)
        const label =
          place.formatted_address ||
          place.name ||
          `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        applyPlaceRef.current(label, lat, lng);
      });
      autocompleteRef.current = ac;
    } catch {
      /* Places optional Enter uses Nominatim fallback */
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [helpMode, mapsLoaded, liveMaps, t]);

  const submitHelpAddress = async () => {
    const typed = helpAddress.trim();
    if (!typed) {
      setHelpError(t("home.typeAddress"));
      return;
    }
    setHelpBusy(true);
    setHelpError(null);
    try {
      const geo = await geocodeAddress(typed);
      if (!geo) {
        setHelpError(t("home.couldNotFind"));
        return;
      }
      applyHelpLocation(geo.label, geo.lat, geo.lng);
    } finally {
      setHelpBusy(false);
    }
  };

  /** Clear address → restore my location (C2). Stay in help mode to type again. */
  const clearHelpingSomeone = () => {
    setHelpingSomeoneElse(null);
    setHelpAddress("");
    setHelpError(null);
    retryLocation();
    refreshNearbyPros();
    window.setTimeout(() => helpInputRef.current?.focus(), 60);
  };

  return {
    helpMode,
    helpAddress,
    setHelpAddress,
    helpBusy,
    helpError,
    setHelpError,
    helpKnownHits,
    setHelpKnownHits,
    helpSuggestOpen,
    setHelpSuggestOpen,
    helpInputRef,
    openHelpSomeone,
    closeHelpMode,
    applyHelpLocation,
    submitHelpAddress,
    clearHelpingSomeone,
  };
}

export type HelpSomeone = ReturnType<typeof useHelpSomeone>;
