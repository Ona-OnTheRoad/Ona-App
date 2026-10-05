"use client";

import { useEffect, useState } from "react";
import { getGoogleMapsApiKey, shouldUseLiveMaps } from "@/lib/google-maps";
import type { Technician } from "@/lib/types";
import { LiveGoogleMap } from "./service-map/live-google-map";
import { OsmServiceMap } from "./service-map/osm-service-map-lazy";

/**
 * Homepage map: force Google Maps when a live key is present.
 * OpenStreetMap only if the key is missing or Google hard-fails this session.
 */
export function ServiceMap({
  technicians,
  onSelect,
}: {
  technicians: Technician[];
  onSelect?: (id: string) => void;
}) {
  const apiKey = getGoogleMapsApiKey();
  const hasKey = shouldUseLiveMaps();
  const [mapFailed, setMapFailed] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  // Always clear legacy fail flags when the live key is installed
  useEffect(() => {
    try {
      sessionStorage.removeItem("om_google_maps_failed");
    } catch {
      /* ignore */
    }
    setMapFailed(false);
  }, [apiKey]);

  // Catch Google billing / auth errors → OSM for this session only
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & { gm_authFailure?: () => void };
    const prev = w.gm_authFailure;
    w.gm_authFailure = () => {
      setMapFailed(true);
      prev?.();
    };
    return () => {
      w.gm_authFailure = prev;
    };
  }, []);

  if (!hasKey) {
    return <OsmServiceMap technicians={technicians} onSelect={onSelect} />;
  }

  if (mapFailed) {
    return (
      <div className="relative h-full w-full">
        <OsmServiceMap technicians={technicians} onSelect={onSelect} />
        <button
          type="button"
          onClick={() => {
            setMapFailed(false);
            setRetryTick((n) => n + 1);
          }}
          className="absolute bottom-14 right-2 z-40 rounded-md border-0 bg-black/70 px-2 py-1 text-[9px] font-semibold text-white/90"
        >
          Retry Google
        </button>
      </div>
    );
  }

  return (
    <LiveGoogleMap
      key={`${apiKey.slice(-6)}-${retryTick}`}
      technicians={technicians}
      onSelect={onSelect}
      onFatalError={() => {
        setMapFailed(true);
      }}
    />
  );
}
