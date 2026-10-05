import dynamic from "next/dynamic";

export const OsmFallback = dynamic(
  () => import("@/components/map/osm-service-map").then((m) => m.OsmServiceMap),
  { ssr: false },
);
