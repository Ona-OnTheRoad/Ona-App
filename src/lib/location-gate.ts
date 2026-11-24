import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_USER_LOCATION } from "@/lib/data/user-location";
import { MAP_GATE_WAIT_MS } from "@/lib/location-gps";
import { useApp } from "@/lib/store";

export type GeoPermission = "granted" | "prompt" | "denied" | "unknown";

/**
 * - checking:  asking the browser for the permission state (brief)
 * - prompt:    permission not answered yet, show the explainer
 * - resolving: allowed, waiting for the first fix (capped by MAP_GATE_WAIT_MS)
 * - ready:     render the map (real fix, cached fix, skipped, or wait expired)
 * - denied:    render the map at the default area with a "set your location" hint
 */
export type LocationGate =
  | "checking"
  | "prompt"
  | "resolving"
  | "ready"
  | "denied";

export function resolveLocationGate(i: {
  /** null while the permission query is still pending */
  permission: GeoPermission | null;
  hasLiveFix: boolean;
  /** A real previous fix exists, so the map can open close to the user */
  hasCachedFix: boolean;
  waitExpired: boolean;
  skipped: boolean;
}): LocationGate {
  if (i.hasLiveFix || i.hasCachedFix || i.skipped) return "ready";
  if (i.permission === "denied") return "denied";
  if (i.permission === "prompt") return "prompt";
  if (i.waitExpired) return "ready";
  if (i.permission === null) return "checking";
  return "resolving";
}

function hasCachedFix(coords: { lat: number; lng: number }): boolean {
  const d = DEFAULT_USER_LOCATION.coordinates;
  return Math.abs(coords.lat - d.lat) > 0.0001 || Math.abs(coords.lng - d.lng) > 0.0001;
}

/** Gates the home map so it opens on the user's location instead of the fallback. */
export function useLocationGate() {
  const { hasLiveFix, location, retryLocation } = useApp();
  const [permission, setPermission] = useState<GeoPermission | null>(null);
  const [waitExpired, setWaitExpired] = useState(false);
  const [skipped, setSkipped] = useState(false);
  // Only the location the app booted with counts as "cached", never later GPS updates.
  const cachedRef = useRef<boolean | null>(null);
  if (cachedRef.current === null) cachedRef.current = hasCachedFix(location.coordinates);

  useEffect(() => {
    let status: PermissionStatus | null = null;
    let cancelled = false;
    const onChange = () => {
      if (status) setPermission(status.state as GeoPermission);
    };
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      setPermission("unknown");
      return;
    }
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((s) => {
        if (cancelled) return;
        status = s;
        setPermission(s.state as GeoPermission);
        s.addEventListener("change", onChange);
      })
      .catch(() => {
        if (!cancelled) setPermission("unknown");
      });
    return () => {
      cancelled = true;
      status?.removeEventListener("change", onChange);
    };
  }, []);

  const gate = resolveLocationGate({
    permission,
    hasLiveFix,
    hasCachedFix: cachedRef.current,
    waitExpired,
    skipped,
  });

  // Cap the wait while a fix is expected so the map can never hang on a slow GPS.
  const waiting = gate === "resolving" || gate === "checking";
  useEffect(() => {
    if (!waiting) return;
    const id = window.setTimeout(() => setWaitExpired(true), MAP_GATE_WAIT_MS);
    return () => window.clearTimeout(id);
  }, [waiting]);

  const allow = useCallback(() => retryLocation(), [retryLocation]);
  const skip = useCallback(() => setSkipped(true), []);

  return { gate, allow, skip };
}
