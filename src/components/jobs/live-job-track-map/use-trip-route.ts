import { useEffect, useState } from "react";
import { haversineRouteEta, type RouteEta } from "./route-eta";

type LatLng = { lat: number; lng: number };

/** Directions: pro -> motorist when both known; route line + ETA only (no re-centering). */
export function useTripRoute({
  isLoaded,
  proPos,
  motoristPos,
  fitTripIfAllowed,
}: {
  isLoaded: boolean;
  proPos: LatLng | null;
  motoristPos: LatLng;
  fitTripIfAllowed: () => void;
}) {
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [routeEta, setRouteEta] = useState<RouteEta | null>(null);

  // Directions: pro → motorist when both known.
  // Updates route line + ETA only does not re-center after user pans.
  useEffect(() => {
    if (!proPos) {
      setDirections(null);
      return;
    }

    const applyHaversineEta = () => {
      setRouteEta(haversineRouteEta(proPos, motoristPos));
      setDirections(null);
      fitTripIfAllowed();
    };

    if (!isLoaded || !window.google?.maps?.DirectionsService) {
      applyHaversineEta();
      return;
    }

    let cancelled = false;
    const svc = new google.maps.DirectionsService();
    svc.route(
      {
        origin: proPos,
        destination: motoristPos,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return;
        if (status === "OK" && result) {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            const sec = leg.duration?.value ?? 0;
            const meters = leg.distance?.value ?? 0;
            setRouteEta({
              minutes: Math.max(1, Math.round(sec / 60)),
              distanceKm: Math.round((meters / 1000) * 100) / 100,
              durationText: leg.duration?.text,
              distanceText: leg.distance?.text,
            });
          }
          // First auto-frame only; later GPS ticks only move pins, not the camera.
          fitTripIfAllowed();
        } else {
          // REQUEST_DENIED / ZERO_RESULTS / OVER_QUERY_LIMIT → still show ETA
          applyHaversineEta();
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    proPos?.lat,
    proPos?.lng,
    motoristPos.lat,
    motoristPos.lng,
    fitTripIfAllowed,
  ]);

  return { directions, routeEta };
}
