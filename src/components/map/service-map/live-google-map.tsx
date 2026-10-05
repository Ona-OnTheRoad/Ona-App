import { useEffect } from "react";
import { useOnaGoogleMaps } from "@/lib/google-maps-loader";
import { useApp } from "@/lib/store";
import type { Technician } from "@/lib/types";
import { GoogleServiceMap } from "./google-service-map";
import { mapThemeForApp } from "./map-theme-ns";
import { OsmServiceMap } from "./osm-service-map-lazy";

export function LiveGoogleMap({
  technicians,
  onSelect,
  onFatalError,
}: {
  technicians: Technician[];
  onSelect?: (id: string) => void;
  onFatalError: (reason?: string) => void;
}) {
  const { isLoaded, loadError } = useOnaGoogleMaps();
  const { theme } = useApp();

  useEffect(() => {
    if (loadError) {
      onFatalError(
        loadError.message ||
          "Could not load Google Maps. Check the API key and that Maps JavaScript API is ON.",
      );
    }
  }, [loadError, onFatalError]);

  if (loadError) {
    return (
      <div className="relative h-full w-full">
        <OsmServiceMap technicians={technicians} onSelect={onSelect} />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="flex h-full w-full items-center justify-center text-sm text-[#a8c9b5]"
        style={{
          backgroundColor: mapThemeForApp(theme === "light").backgroundColor,
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          Loading live Google Maps…
        </div>
      </div>
    );
  }

  return (
    <GoogleServiceMap
      technicians={technicians}
      onSelect={onSelect}
      onFatalError={() =>
        onFatalError(
          "Map tiles blocked. Enable Maps JavaScript API + billing for this key.",
        )
      }
    />
  );
}
