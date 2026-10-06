"use client";

import { useRef } from "react";
import { Check, Loader2 } from "lucide-react";
import { shouldUseLiveMaps } from "@/lib/google-maps";
import { useOnaGoogleMaps } from "@/lib/google-maps-loader";
import { matchKnownPlaces } from "@/lib/known-places";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AddressSearchInput } from "./address-autocomplete/address-search-input";
import { useAddressPick } from "./address-autocomplete/use-address-pick";
import { useAddressSearch } from "./address-autocomplete/use-address-search";
import type { PickedLocation } from "./location-picker-map";

/**
 * inDrive-style address search no map. A prominent search field with
 * Google Places autocomplete (curated local places as extra suggestions),
 * tied to Google Maps via Places details / Geocoder, plus "Use my current
 * location". The confirmed address is shown as a checked chip so the field
 * is never "just a box".
 */
export function AddressAutocomplete({
  value,
  onChange,
  className,
}: {
  value?: PickedLocation | null;
  onChange: (loc: PickedLocation) => void;
  className?: string;
}) {
  const { theme } = useApp();
  const isLight = theme === "light";
  const live = shouldUseLiveMaps();
  const { isLoaded } = useOnaGoogleMaps();

  const placesAnchorRef = useRef<HTMLDivElement | null>(null);

  const {
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
  } = useAddressPick({ value, onChange });

  const {
    knownHits,
    setKnownHits,
    googleHits,
    onQueryChange,
    selectGoogle,
    submitSearch,
  } = useAddressSearch({
    isLoaded,
    live,
    placesAnchorRef,
    query,
    setQuery,
    setBusy,
    setStatus,
    setOpenSuggest,
    applyPick,
    applyKnown,
    reverseGeocode,
  });

  const showPanel =
    openSuggest &&
    query.trim().length >= 2 &&
    (knownHits.length > 0 || googleHits.length > 0);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <AddressSearchInput
        isLight={isLight}
        query={query}
        busy={busy}
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
          window.setTimeout(() => setOpenSuggest(false), 180);
        }}
        onEnter={() => {
          setOpenSuggest(false);
          submitSearch();
        }}
        onEscape={() => setOpenSuggest(false)}
        onUseMyLocation={useMyLocation}
        onPickKnown={applyKnown}
        onPickGoogle={selectGoogle}
      />

      {value ? (
        <div
          className={cn(
            "flex items-start gap-2 rounded-md px-2.5 py-2",
            isLight ? "bg-[#FF6B35]/10" : "bg-[#FF6B35]/15",
          )}
        >
          <Check
            className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6B35]"
            strokeWidth={2.5}
          />
          <span
            className={cn(
              "min-w-0 text-[12px] font-semibold leading-snug",
              isLight ? "text-slate-800" : "text-white/90",
            )}
          >
            {value.label}
          </span>
        </div>
      ) : null}

      {busy ? (
        <p
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium",
            isLight ? "text-slate-500" : "text-white/45",
          )}
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          Getting address…
        </p>
      ) : null}
      {status ? (
        <p className="text-[11px] font-medium text-[#FF6B35]">{status}</p>
      ) : null}

      {/* Anchors PlacesService so details can resolve without a map instance */}
      <div ref={placesAnchorRef} className="hidden" />
    </div>
  );
}
