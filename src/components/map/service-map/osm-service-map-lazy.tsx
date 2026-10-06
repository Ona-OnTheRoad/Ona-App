import dynamic from "next/dynamic";
import { MapLoading } from "./map-loading";

export const OsmServiceMap = dynamic(
  () => import("../osm-service-map").then((m) => m.OsmServiceMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);
