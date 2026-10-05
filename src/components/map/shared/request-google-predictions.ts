import type { Dispatch, RefObject, SetStateAction } from "react";

export type GoogleSuggestion = {
  id: string;
  primary: string;
  secondary: string;
  placeId: string;
};

/**
 * Google Places autocomplete request shared by the map picker and the
 * address field. Callers keep their own "is Google ready" guard.
 */
export function requestGooglePredictions(
  text: string,
  sessionTokenRef: RefObject<google.maps.places.AutocompleteSessionToken | null>,
  setGoogleHits: Dispatch<SetStateAction<GoogleSuggestion[]>>,
) {
  try {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current =
        new google.maps.places.AutocompleteSessionToken();
    }
    const svc = new google.maps.places.AutocompleteService();
    svc.getPlacePredictions(
      {
        input: text,
        componentRestrictions: { country: ["ng"] },
        sessionToken: sessionTokenRef.current,
      },
      (preds, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !preds?.length
        ) {
          setGoogleHits([]);
          return;
        }
        setGoogleHits(
          preds.slice(0, 5).map((p) => ({
            id: p.place_id,
            primary:
              p.structured_formatting?.main_text ||
              p.description.split(",")[0] ||
              p.description,
            secondary: p.structured_formatting?.secondary_text || p.description,
            placeId: p.place_id,
          })),
        );
      },
    );
  } catch {
    setGoogleHits([]);
  }
}
