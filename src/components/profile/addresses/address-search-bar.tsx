"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Crosshair, MapPin } from "lucide-react";
import { matchKnownPlaces, resolveKnownPlace, type KnownPlace } from "@/lib/known-places";
import {
  requestGooglePredictions,
  type GoogleSuggestion,
} from "@/components/map/shared/request-google-predictions";

interface AddressSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onLocate: () => void;
  onSelectPlace: (place: { label: string; lat: number; lng: number }) => void;
  isLocating?: boolean;
}

export function AddressSearchBar({
  value,
  onChange,
  onLocate,
  onSelectPlace,
  isLocating = false,
}: AddressSearchBarProps) {
  const [openSuggest, setOpenSuggest] = useState(false);
  const [knownHits, setKnownHits] = useState<KnownPlace[]>([]);
  const [googleHits, setGoogleHits] = useState<GoogleSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenSuggest(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (text: string) => {
    onChange(text);
    if (text.trim().length < 2) {
      setKnownHits([]);
      setGoogleHits([]);
      setOpenSuggest(false);
      return;
    }

    setOpenSuggest(true);
    // Instant curated places match
    const known = matchKnownPlaces(text, 4).map((r) => r.place);
    setKnownHits(known);

    // Debounced Google Places suggestions
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      if (typeof window !== "undefined" && window.google?.maps?.places) {
        requestGooglePredictions(text.trim(), sessionTokenRef, setGoogleHits);
      }
    }, 200);
  };

  const handlePickKnown = (place: KnownPlace) => {
    const label = `${place.name}, ${place.city || "Lagos"}`;
    onChange(label);
    onSelectPlace({ label, lat: place.lat, lng: place.lng });
    setOpenSuggest(false);
  };

  const handlePickGoogle = async (suggestion: GoogleSuggestion) => {
    const fullLabel = suggestion.primary + (suggestion.secondary ? `, ${suggestion.secondary}` : "");
    onChange(fullLabel);
    setOpenSuggest(false);
    sessionTokenRef.current = null;

    // Check if known place
    const known = resolveKnownPlace(fullLabel);
    if (known) {
      onSelectPlace({ label: fullLabel, lat: known.lat, lng: known.lng });
      return;
    }

    // Geocode Google place
    if (typeof window !== "undefined" && window.google?.maps) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const res = await geocoder.geocode({
          address: `${suggestion.primary}, ${suggestion.secondary}`,
          componentRestrictions: { country: "ng" },
        });
        if (res?.results?.[0]?.geometry?.location) {
          const lat = res.results[0].geometry.location.lat();
          const lng = res.results[0].geometry.location.lng();
          onSelectPlace({ label: fullLabel, lat, lng });
          return;
        }
      } catch {
        /* fallback below */
      }
    }

    // Nominatim fallback geocode
    try {
      const q = encodeURIComponent(`${suggestion.primary}, Lagos, Nigeria`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
      const data = await res.json();
      if (data?.[0]?.lat && data?.[0]?.lon) {
        onSelectPlace({
          label: fullLabel,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        });
      }
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async () => {
    const text = value.trim();
    if (!text) return;
    setOpenSuggest(false);

    // 1. Direct known place match
    const known = resolveKnownPlace(text);
    if (known) {
      onSelectPlace({ label: text, lat: known.lat, lng: known.lng });
      return;
    }
    if (knownHits[0]) {
      handlePickKnown(knownHits[0]);
      return;
    }
    if (googleHits[0]) {
      void handlePickGoogle(googleHits[0]);
      return;
    }

    // 2. Freeform Geocoding
    setIsSearching(true);
    try {
      if (typeof window !== "undefined" && window.google?.maps) {
        const geocoder = new window.google.maps.Geocoder();
        const res = await geocoder.geocode({
          address: text,
          componentRestrictions: { country: "ng" },
        });
        if (res?.results?.[0]?.geometry?.location) {
          const lat = res.results[0].geometry.location.lat();
          const lng = res.results[0].geometry.location.lng();
          onSelectPlace({ label: text, lat, lng });
          setIsSearching(false);
          return;
        }
      }

      // Nominatim search fallback
      const q = encodeURIComponent(`${text}, Lagos, Nigeria`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
      const data = await res.json();
      if (data?.[0]?.lat && data?.[0]?.lon) {
        onSelectPlace({
          label: text,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        });
      }
    } catch {
      /* ignore */
    } finally {
      setIsSearching(false);
    }
  };

  const showDropdown = openSuggest && (knownHits.length > 0 || googleHits.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="h-12 w-full rounded-2xl border border-ona-border bg-ona-surface px-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MapPin className="h-4 w-4 text-ona-muted shrink-0" strokeWidth={1.8} />
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (value.trim().length >= 2) setOpenSuggest(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit();
              }
              if (e.key === "Escape") setOpenSuggest(false);
            }}
            placeholder="Search address or area..."
            className="w-full bg-transparent text-[13px] font-normal text-ona-ink placeholder:text-ona-muted outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onLocate}
          disabled={isLocating || isSearching}
          title="Use my current location"
          className="text-ona-muted hover:text-[#F05A30] transition-colors p-1 -mr-1 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Crosshair
            className={`h-4.5 w-4.5 ${isLocating || isSearching ? "animate-spin text-[#F05A30]" : ""}`}
            strokeWidth={1.8}
          />
        </button>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-60 overflow-y-auto rounded-2xl border border-ona-border bg-white dark:bg-ona-surface shadow-lg divide-y divide-ona-border/50">
          {knownHits.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => handlePickKnown(place)}
              className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-ona-field transition-colors cursor-pointer"
            >
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F05A30]" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-ona-ink truncate">{place.name}</p>
                <p className="text-[10.5px] font-normal text-ona-muted truncate">{place.address}</p>
              </div>
            </button>
          ))}

          {googleHits.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void handlePickGoogle(item)}
              className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-ona-field transition-colors cursor-pointer"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ona-muted" strokeWidth={1.8} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-ona-ink truncate">{item.primary}</p>
                <p className="text-[10.5px] font-normal text-ona-muted truncate">{item.secondary}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
