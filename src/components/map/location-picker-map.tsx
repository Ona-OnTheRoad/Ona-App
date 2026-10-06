"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { shouldUseLiveMaps } from "@/lib/google-maps";
import { useOnaGoogleMaps } from "@/lib/google-maps-loader";
import { matchKnownPlaces } from "@/lib/known-places";
import { applyOnaMapTheme, mapThemeForApp } from "@/lib/map-theme";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LocationSearchBox } from "./location-picker-map/location-search-box";
import { PickerMapSurface } from "./location-picker-map/picker-map-surface";
import type { LocationPickerProps } from "./location-picker-map/types";
import { usePickerPin } from "./location-picker-map/use-picker-pin";
import { usePickerSearch } from "./location-picker-map/use-picker-search";

export type { PickedLocation } from "./location-picker-map/types";

const OsmLocationPicker = dynamic(
  () => import("./osm-location-picker").then((m) => m.OsmLocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-52 items-center justify-center rounded-md bg-[#d4d5db] text-[12px] font-medium text-[#475569]">
        Loading live map…
      </div>
    ),
  },
);

/**
 * Live Google Map location picker for Motorist "Where are you?" and anywhere else.
 * Curated places (e.g. 1st Price Furniture Company) appear only as search suggestions.
 */
export function LocationPickerMap({
  value,
  onChange,
  className,
  compact = false,
}: LocationPickerProps) {
  const { theme } = useApp();
  const isLight = theme === "light";
  const mapTheme = mapThemeForApp(isLight);
  const mapH = compact ? "h-36" : "h-52";
  const live = shouldUseLiveMaps();
  // Shared loader never pass a different apiKey than other maps.
  const { isLoaded, loadError } = useOnaGoogleMaps();

  const mapRef = useRef<google.maps.Map | null>(null);

  // Match home map palette + street names when light ↔ dark toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applyOnaMapTheme(map, isLight);
  }, [isLight]);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
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
    applyKnown,
    applyPick,
    reverseGeocode,
    placePin,
    goToMyLocation,
  } = usePickerPin({ value, onChange, mapRef });

  const {
    knownHits,
    setKnownHits,
    googleHits,
    onQueryChange,
    selectGoogle,
    submitSearch,
  } = usePickerSearch({
    isLoaded,
    live,
    mapRef,
    query,
    setQuery,
    setBusy,
    setStatus,
    setOpenSuggest,
    applyPick,
    applyKnown,
    reverseGeocode,
  });

  if (!live || loadError) {
    return (
      <OsmLocationPicker
        value={value}
        onChange={onChange}
        className={className}
        compact={compact}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md text-[12px] font-medium text-[#a8c9b5]",
          mapH,
          className,
        )}
        style={{ backgroundColor: mapTheme.backgroundColor }}
      >
        Loading live map…
      </div>
    );
  }

  const showPanel =
    openSuggest &&
    query.trim().length >= 2 &&
    (knownHits.length > 0 || googleHits.length > 0);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <LocationSearchBox
        inputRef={inputRef}
        query={query}
        showPanel={showPanel}
        knownHits={knownHits}
        googleHits={googleHits}
        onQueryChange={onQueryChange}
        onFocusSuggest={() => {
          if (query.trim().length >= 2) {
            setKnownHits(matchKnownPlaces(query, 4).map((r) => r.place));
            setOpenSuggest(true);
          }
        }}
        onBlurSuggest={() => {
          // Delay so click on suggestion registers
          window.setTimeout(() => setOpenSuggest(false), 180);
        }}
        onEscape={() => setOpenSuggest(false)}
        onSubmit={submitSearch}
        onPickKnown={applyKnown}
        onPickGoogle={selectGoogle}
      />

      <PickerMapSurface
        mapRef={mapRef}
        mapH={mapH}
        isLight={isLight}
        mapTheme={mapTheme}
        center={center}
        pin={pin}
        query={query}
        busy={busy}
        placePin={placePin}
        goToMyLocation={goToMyLocation}
      />

      {(status || value?.label || query) && (
        <p className="text-[11px] leading-snug text-[#475569]">
          {busy ? "Updating address…" : status || value?.label || query}
        </p>
      )}
    </div>
  );
}
