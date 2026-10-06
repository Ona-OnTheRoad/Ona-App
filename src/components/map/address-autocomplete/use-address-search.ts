import {
  useCallback,
  useEffect,
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
import type { PickedLocation } from "../location-picker-map";
import {
  requestGooglePredictions,
  type GoogleSuggestion,
} from "../shared/request-google-predictions";
import { parseGeocodeResult } from "./parse-geocode-result";

/** Known-place + Google Places + Nominatim search for the address field. */
export function useAddressSearch({
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
}: {
  isLoaded: boolean;
  live: boolean;
  placesAnchorRef: RefObject<HTMLDivElement | null>;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setStatus: Dispatch<SetStateAction<string | null>>;
  setOpenSuggest: Dispatch<SetStateAction<boolean>>;
  applyPick: (picked: PickedLocation) => void;
  applyKnown: (place: KnownPlace) => void;
  reverseGeocode: (lat: number, lng: number) => Promise<void>;
}) {
  const [knownHits, setKnownHits] = useState<KnownPlace[]>([]);
  const [googleHits, setGoogleHits] = useState<GoogleSuggestion[]>([]);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

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
    setKnownHits(matchKnownPlaces(text, 4).map((r) => r.place));
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
    const knownFromText = resolveKnownPlace(`${s.primary} ${s.secondary}`);
    if (knownFromText) {
      applyKnown(knownFromText);
      sessionTokenRef.current = null;
      return;
    }
    if (!window.google?.maps?.places || !placesAnchorRef.current) {
      setBusy(true);
      void (async () => {
        try {
          const known =
            resolveKnownPlace(`${s.primary} ${s.secondary}`) || knownHits[0];
          if (known) {
            applyKnown(known);
            return;
          }
          if (window.google?.maps) {
            const geocoder = new google.maps.Geocoder();
            const { results } = await geocoder.geocode({
              address: `${s.primary}, ${s.secondary}`,
              componentRestrictions: { country: "ng" },
            });
            if (results?.[0]?.geometry?.location) {
              const lat = results[0].geometry.location.lat();
              const lng = results[0].geometry.location.lng();
              applyPick(parseGeocodeResult(results[0], lat, lng));
            }
          }
        } finally {
          setBusy(false);
        }
      })();
      return;
    }
    setBusy(true);
    const svc = new google.maps.places.PlacesService(placesAnchorRef.current);
    svc.getDetails(
      {
        placeId: s.placeId,
        fields: ["formatted_address", "geometry", "name", "address_components"],
        sessionToken: sessionTokenRef.current ?? undefined,
      },
      (place, st) => {
        setBusy(false);
        sessionTokenRef.current = null;
        if (
          st !== google.maps.places.PlacesServiceStatus.OK ||
          !place?.geometry?.location
        ) {
          setStatus("Could not open that place. Try again.");
          return;
        }
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
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
            applyPick(parseGeocodeResult(results[0], lat, lng));
            return;
          }
        }
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
            typed,
          )}`,
          { headers: { Accept: "application/json" } },
        );
        const data = (await res.json()) as {
          lat?: string;
          lon?: string;
          display_name?: string;
        }[];
        const hit = data?.[0];
        if (hit?.lat && hit?.lon) {
          applyPick({
            lat: Number(hit.lat),
            lng: Number(hit.lon),
            label: hit.display_name || typed,
            city: hit.display_name || typed,
            area: hit.display_name || typed,
          });
          return;
        }
        setStatus("Could not find that place. Pick a suggestion instead.");
      } finally {
        setBusy(false);
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
