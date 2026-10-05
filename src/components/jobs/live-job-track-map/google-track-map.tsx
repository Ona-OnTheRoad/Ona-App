import { useMemo } from "react";
import { DirectionsRenderer, GoogleMap, Marker } from "@react-google-maps/api";
import { useOnaGoogleMaps } from "@/lib/google-maps-loader";
import { MapTintOverlay } from "@/components/map/map-tint-overlay";
import {
  MAP_ROUTE_STROKE,
  MAP_STYLE_REVISION,
  mapContainerStyle,
  mapRenderOptions,
  mapThemeForApp,
  mapThemeForTrackTrip,
} from "@/lib/map-theme";
import type { JobRecord } from "@/lib/jobs/types";
import {
  USER_MAP_PIN_ANCHOR,
  USER_MAP_PIN_SIZE,
  userMapPinUrl,
} from "@/lib/map-user-pin";
import { cn, formatDistance, formatEta } from "@/lib/utils";
import { OsmFallback } from "./osm-fallback";
import { ProMapPin } from "./pro-map-pin";
import { tripProTechnicians } from "./pro-technicians";
import { TripMapStatsBar } from "./trip-map-stats-bar";
import { useTripCamera } from "./use-trip-camera";
import { useTripRoute } from "./use-trip-route";

export function GoogleTrackMap({
  job,
  isLight,
  viewer,
}: {
  job: JobRecord;
  isLight: boolean;
  viewer: "motorist" | "repair_pro";
}) {
  const motoristPos = job.motoristLocation;
  const proPos = job.proLocation || null;

  // Same green/red dashboard map colors as customer home both theme modes.
  const theme = mapThemeForApp(isLight);
  const tripTheme = useMemo(() => mapThemeForTrackTrip(isLight), [isLight]);

  const { isLoaded, loadError } = useOnaGoogleMaps();

  const { initialCenterRef, fitTripIfAllowed, onLoad } = useTripCamera({
    proPos,
    motoristPos,
    isLight,
    isLoaded,
  });

  const { directions, routeEta } = useTripRoute({
    isLoaded,
    proPos,
    motoristPos,
    fitTripIfAllowed,
  });

  const motoristTitle = viewer === "motorist" ? "You" : "Customer";
  const proLabel = viewer === "repair_pro" ? "You" : "Repair Pro";

  const displayEtaMin = job.etaMinutes ?? routeEta?.minutes ?? null;
  const displayDist = job.distanceKm ?? routeEta?.distanceKm ?? null;
  const timeValue =
    job.etaText ||
    routeEta?.durationText ||
    (displayEtaMin != null ? formatEta(displayEtaMin) : "Not set");
  const distValue =
    job.distanceText ||
    routeEta?.distanceText ||
    (displayDist != null ? formatDistance(displayDist) : "Not set");

  if (loadError) {
    return (
      <div
        className="relative h-full w-full"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        <OsmFallback technicians={tripProTechnicians(job, proPos)} />
        <TripMapStatsBar
          time={timeValue}
          distance={distValue}
          isLight={isLight}
        />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="flex h-full w-full items-center justify-center text-sm text-[#a8c9b5]"
        style={{ backgroundColor: tripTheme.backgroundColor }}
      >
        Loading live map…
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full"
      data-map-surface="track-trip"
      data-map-engine="google"
      data-map-theme={isLight ? "light" : "dark"}
      data-map-rev={MAP_STYLE_REVISION}
      style={{ backgroundColor: tripTheme.backgroundColor }}
    >
      <GoogleMap
        key={`track-${MAP_STYLE_REVISION}-${isLight ? "light" : "dark"}`}
        mapContainerStyle={mapContainerStyle(isLight, {
          backgroundColor: tripTheme.backgroundColor,
        })}
        // Stable initial center only do not pass live GPS midpoints or the map snaps back.
        center={initialCenterRef.current}
        zoom={16}
        onLoad={onLoad}
        options={{
          ...mapRenderOptions(isLight),
          styles: tripTheme.styles,
          backgroundColor: tripTheme.backgroundColor,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position:
              typeof google !== "undefined"
                ? google.maps.ControlPosition.RIGHT_BOTTOM
                : 9,
          },
          mapTypeId:
            typeof google !== "undefined"
              ? google.maps.MapTypeId.ROADMAP
              : "roadmap",
          draggable: true,
          scrollwheel: true,
          gestureHandling: "greedy",
          maxZoom: 19,
          minZoom: 12,
        }}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              // Critical: route updates must not re-center the map under the user.
              preserveViewport: true,
              polylineOptions: {
                strokeColor: MAP_ROUTE_STROKE,
                strokeWeight: 5,
                strokeOpacity: 0.92,
              },
            }}
          />
        )}

        {/* Motorist pin icon only (no “You” text) */}
        <Marker
          position={motoristPos}
          icon={{
            url: userMapPinUrl(USER_MAP_PIN_SIZE),
            scaledSize: new google.maps.Size(
              USER_MAP_PIN_SIZE,
              USER_MAP_PIN_SIZE,
            ),
            anchor: new google.maps.Point(
              USER_MAP_PIN_ANCHOR,
              USER_MAP_PIN_ANCHOR,
            ),
          }}
          title={motoristTitle}
          zIndex={500}
        />

        {/* Repair Pro pin flat orange icon, no glow */}
        {proPos && (
          <ProMapPin
            position={proPos}
            label={proLabel}
            serviceType={job.serviceType}
          />
        )}
      </GoogleMap>
      <MapTintOverlay isLight={isLight} />

      <TripMapStatsBar
        time={timeValue}
        distance={distValue}
        isLight={isLight}
      />

      {viewer === "motorist" && !proPos && (
        <div
          className={cn(
            "absolute inset-x-3 top-3 rounded-sm px-3 py-2 text-center text-[12px] font-bold",
            isLight
              ? "bg-[#e8e9ed] text-slate-800 shadow-md"
              : "bg-[#1c1c1e] text-white shadow-md",
          )}
        >
          Waiting for Repair Pro live location…
        </div>
      )}
      {viewer === "repair_pro" && !proPos && (
        <div
          className={cn(
            "absolute inset-x-3 top-3 rounded-sm px-3 py-2 text-center text-[12px] font-bold",
            isLight
              ? "bg-[#e8e9ed] text-slate-800 shadow-md"
              : "bg-[#1c1c1e] text-white shadow-md",
          )}
        >
          Enable GPS to show your live pin · motorist marked below
        </div>
      )}
    </div>
  );
}
