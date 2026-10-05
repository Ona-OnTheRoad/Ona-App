import { useCallback, useEffect, useRef } from "react";
import { DEFAULT_USER_LOCATION, LAST_GPS_KEY } from "@/lib/data/technicians";
import {
  GPS_BOOT_TIMEOUT_MS,
  GPS_RETRY_TIMEOUT_MS,
  shouldSurfaceLocationError,
} from "@/lib/location-gps";
import { MAX_RADIUS_KM } from "@/lib/matching";
import { LOCATION_REFRESH_MS } from "./constants";
import type { SessionStateResult } from "./use-session-state";
import type { MarketStateResult } from "./use-market-state";

export function useLocationAndRadius(
  session: SessionStateResult,
  market: MarketStateResult,
) {
  const { isAuthenticated } = session;
  const { setLocation, setRadiusKmState, setLocationError, setIsLocating } =
    market;

  /** User manually pinned a place don't overwrite with GPS until Retry */
  const manualPinRef = useRef(false);
  /** Map browser GPS errors to clear, actionable copy (not raw "User denied Geolocation"). */
  const friendlyGeolocationError = useCallback(
    (err?: GeolocationPositionError | null) => {
      const code = err?.code;
      // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
      if (code === 1) {
        return "Location is blocked. Allow it in the browser address bar (or site settings), then tap Retry.";
      }
      if (code === 3) {
        return "Location timed out. Check GPS signal, then tap Retry.";
      }
      if (code === 2) {
        return "Location unavailable right now. Check that Location Services are on, then tap Retry.";
      }
      if (typeof navigator !== "undefined" && !navigator.geolocation) {
        return "Location is not available on this device. You can still set a place manually.";
      }
      return "We couldn’t get your location. Allow location access, then tap Retry.";
    },
    [],
  );

  /** Last reverse-geocode time avoid Google Geocoding on every GPS tick */
  const lastGeocodeAt = useRef(0);
  /** Last full address string from geocode (for throttle) */
  const lastFullAddressRef = useRef("");

  const applyGpsFix = useCallback(
    (pos: GeolocationPosition, silent = false) => {
      // Manual pin wins until user taps Retry / Use my location
      if (manualPinRef.current) {
        if (!silent) setIsLocating(false);
        return;
      }
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      // Keep coords immediately; keep previous full address until reverse-geocode returns
      setLocation((prev) => {
        // Drop boot/fallback labels immediately; keep a real prior address until geocode
        const isPlaceholder =
          !prev.label ||
          prev.label === "Current location" ||
          prev.label === "Locating…" ||
          prev.label === DEFAULT_USER_LOCATION.label;
        return {
          label: isPlaceholder ? "Locating…" : prev.label,
          city:
            isPlaceholder || prev.city === "Near you" ? "" : prev.city || "",
          coordinates: { lat, lng },
        };
      });
      setLocationError(null);
      if (!silent) setIsLocating(false);

      // Resolve FULL Google formatted address (never area-only like "Lekki")
      const now = Date.now();
      const hasFull =
        lastFullAddressRef.current.includes(",") &&
        lastFullAddressRef.current.length > 12;
      // 10 min throttle reverse-geocode is the heaviest mobile data cost on boot
      if (hasFull && now - lastGeocodeAt.current < 600_000) {
        try {
          localStorage.setItem(
            LAST_GPS_KEY,
            JSON.stringify({
              lat,
              lng,
              label: lastFullAddressRef.current,
              city: "",
            }),
          );
        } catch {
          /* */
        }
        return;
      }
      lastGeocodeAt.current = now;
      void import("@/lib/google-maps").then(({ reverseGeocodeLatLng }) =>
        reverseGeocodeLatLng(lat, lng).then((geo) => {
          if (!geo || manualPinRef.current) return;
          // Immediate place name only never raw coordinates
          const label = (geo.label || "").trim();
          if (!label || /^-?\d+\.\d+/.test(label)) return;
          const city = (geo.localityLine || geo.city || geo.area || "").trim();
          lastFullAddressRef.current = label;
          setLocation({
            label,
            city,
            coordinates: { lat, lng },
          });
          try {
            localStorage.setItem(
              LAST_GPS_KEY,
              JSON.stringify({ lat, lng, label, city }),
            );
          } catch {
            /* */
          }
        }),
      );
    },
    [setIsLocating, setLocation, setLocationError],
  );

  const retryLocation = useCallback(() => {
    manualPinRef.current = false;
    setIsLocating(true);
    setLocationError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(
        "Location is not available on this device. You can still set a place manually.",
      );
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => applyGpsFix(pos, false),
      (err) => {
        // Keep last-known / Ajegunle fallback never invent a random Lagos pin
        setLocationError(friendlyGeolocationError(err));
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: GPS_RETRY_TIMEOUT_MS,
        maximumAge: 0, // force fresh fix
      },
    );
  }, [applyGpsFix, friendlyGeolocationError, setIsLocating, setLocationError]);

  // GPS only after auth login/signup must not burn GPS + reverse-geocode
  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelled = false;
    setIsLocating(true);

    // Boot/refresh pull low-accuracy, patient, and SILENT when the user
    // already has a usable (cached) location. A 5s timeout + error-on-reload
    // was the "Location timed out / Retry" that appeared even though GPS was
    // fine and a cached fix already existed.
    const pull = (surface: boolean) => {
      if (cancelled || manualPinRef.current) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          applyGpsFix(pos, true);
          setIsLocating(false);
        },
        (err) => {
          if (cancelled) return;
          setIsLocating(false);
          if (surface) setLocationError(friendlyGeolocationError(err));
        },
        {
          enableHighAccuracy: false,
          timeout: GPS_BOOT_TIMEOUT_MS,
          maximumAge: 180_000,
        },
      );
    };

    let hasUsableLocation = false;
    try {
      hasUsableLocation = Boolean(localStorage.getItem(LAST_GPS_KEY));
    } catch {
      /* */
    }

    // First pull surfaces an error ONLY when nothing usable is cached yet
    // (explicit "Retry" always surfaces regardless, via retryLocation).
    pull(
      shouldSurfaceLocationError({
        silentRequest: true,
        hasUsableLocation,
      }),
    );
    const intervalId = window.setInterval(() => {
      if (document.hidden || manualPinRef.current) return;
      // Background refresh never surfaces errors (we already have a fix)
      pull(false);
    }, LOCATION_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    applyGpsFix,
    friendlyGeolocationError,
    isAuthenticated,
    setIsLocating,
    setLocationError,
  ]);

  const setManualLocation = useCallback(
    (label: string, coords?: { lat: number; lng: number }) => {
      if (
        !coords ||
        !Number.isFinite(coords.lat) ||
        !Number.isFinite(coords.lng)
      ) {
        setLocationError("Pick a place on the map or allow GPS.");
        return;
      }
      manualPinRef.current = true;
      setLocation({
        label: label || "Pinned location",
        city: label || "Pinned",
        coordinates: { lat: coords.lat, lng: coords.lng },
      });
      setLocationError(null);
      try {
        localStorage.setItem(
          LAST_GPS_KEY,
          JSON.stringify({
            lat: coords.lat,
            lng: coords.lng,
            label: label || "Pinned location",
            city: label || "Pinned",
          }),
        );
      } catch {
        /* */
      }
    },
    [setLocation, setLocationError],
  );

  const setRadiusKm = useCallback(
    (n: number) => {
      const clamped = Math.min(MAX_RADIUS_KM, Math.max(0.5, n));
      setRadiusKmState(clamped);
    },
    [setRadiusKmState],
  );
  return {
    retryLocation,
    setManualLocation,
    setRadiusKm,
  };
}

export type LocationAndRadiusResult = ReturnType<typeof useLocationAndRadius>;
