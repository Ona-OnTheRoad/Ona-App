import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  matchKnownPlaces,
  resolveKnownPlace,
  type KnownPlace,
} from "@/lib/known-places";
import {
  requestGooglePredictions,
  type GoogleSuggestion,
} from "../shared/request-google-predictions";
import { parseGeocodeResult } from "./parse-geocode-result";
import type { PickedLocation } from "./types";

/** Known-place + Google Places search for the map picker. */
export function usePickerSearch({
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
}: {
  isLoaded: boolean;
  live: boolean;
  mapRef: RefObject<google.maps.Map | null>;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setStatus: Dispatch<SetStateAction<string | null>>;
  setOpenSuggest: Dispatch<SetStateAction<boolean>>;
  applyPick: (picked: PickedLocation, zoom?: number) => void;
  applyKnown: (place: KnownPlace) => void;
  reverseGeocode: (lat: number, lng: number) => Promise<void>;
}) {
  const [knownHits, setKnownHits] = useState<KnownPlace[]>([]);
  const [googleHits, setGoogleHits] = useState<GoogleSuggestion[]>([]);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<number | null>(null);

  const fetchGoogleSuggestions = useCallback(
    (text: string) => {
      if (!isLoaded || !live || !window.google?.maps?.places) {
        setGoogleHits([]);
        return;
      }
      requestGooglePredictions(text, sessionTokenRef, setGoogleHits);
    },
    [isLoaded, live],
  );

  const onQueryChange = (text: string) => {
    setQuery(text);
    setOpenSuggest(true);
    const known = matchKnownPlaces(text, 4).map((r) => r.place);
    setKnownHits(known);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setGoogleHits([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      fetchGoogleSuggestions(text.trim());
    }, 220);
  };

  const selectGoogle = (s: GoogleSuggestion) => {
    if (!window.google?.maps?.places || !mapRef.current) {
      // Geocoder fallback by description
      void (async () => {
        const known = resolveKnownPlace(s.primary + " " + s.secondary);
        if (known) {
          applyKnown(known);
          return;
        }
        setBusy(true);
        try {
          const geocoder = new google.maps.Geocoder();
          const { results } = await geocoder.geocode({
            address: `${s.primary}, ${s.secondary}`,
            componentRestrictions: { country: "ng" },
          });
          if (results?.[0]?.geometry?.location) {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();
            applyPick(parseGeocodeResult(results[0], lat, lng), 16);
          }
        } finally {
          setBusy(false);
        }
      })();
      return;
    }

    // If Google row is really our address, prefer curated name
    const knownFromText = resolveKnownPlace(`${s.primary} ${s.secondary}`);
    if (knownFromText) {
      applyKnown(knownFromText);
      sessionTokenRef.current = null;
      return;
    }

    setBusy(true);
    const svc = new google.maps.places.PlacesService(mapRef.current);
    svc.getDetails(
      {
        placeId: s.placeId,
        fields: ["formatted_address", "geometry", "name", "address_components"],
        sessionToken: sessionTokenRef.current ?? undefined,
      },
      (place, status) => {
        setBusy(false);
        sessionTokenRef.current = null;
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !place?.geometry?.location
        ) {
          setStatus("Could not open that place. Try again.");
          return;
        }
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        // Google suggestion → use Google address (curated POI only if user picked from known list)
        if (place.formatted_address) {
          applyPick({
            lat,
            lng,
            label: place.formatted_address,
            city: place.formatted_address,
            area: place.name || place.formatted_address,
          });
        } else {
          void reverseGeocode(lat, lng);
        }
      },
    );
  };

  const submitSearch = () => {
    const typed = query.trim();
    if (!typed) return;
    const known = resolveKnownPlace(typed);
    if (known) {
      applyKnown(known);
      return;
    }
    if (knownHits[0]) {
      applyKnown(knownHits[0]);
      return;
    }
    if (googleHits[0]) {
      selectGoogle(googleHits[0]);
      return;
    }
    // Geocode typed free text
    setBusy(true);
    void (async () => {
      try {
        if (window.google?.maps) {
          const geocoder = new google.maps.Geocoder();
          const { results } = await geocoder.geocode({
            address: typed,
            componentRestrictions: { country: "ng" },
          });
          if (results?.[0]?.geometry?.location) {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();
            applyPick(parseGeocodeResult(results[0], lat, lng), 16);
            return;
          }
        }
        setStatus("Could not find that place. Try a fuller address.");
      } finally {
        setBusy(false);
        setOpenSuggest(false);
      }
    })();
  };

  return {
    knownHits,
    setKnownHits,
    googleHits,
    onQueryChange,
    selectGoogle,
    submitSearch,
  };
}
