import type { TradeAttributeDef } from "./types";

/** Shared vehicle fitment attribute defs. */
export const VEHICLE_FITMENT: TradeAttributeDef[] = [
  { key: "vehicleMake", label: "Make", type: "text", filterable: true },
  { key: "vehicleModel", label: "Model", type: "text", filterable: true },
  { key: "vehicleYear", label: "Year", type: "number", filterable: true },
  {
    key: "position",
    label: "Position",
    type: "enum",
    filterable: true,
    options: [
      "Front",
      "Rear",
      "Left",
      "Right",
      "Driver",
      "Passenger",
      "Upper",
      "Lower",
    ],
  },
  { key: "engine", label: "Engine", type: "text", filterable: false },
];

export const HARDWARE: TradeAttributeDef[] = [
  {
    key: "material",
    label: "Material",
    type: "enum",
    filterable: true,
    options: [
      "Steel",
      "Aluminium",
      "Copper",
      "Brass",
      "Cast iron",
      "PVC",
      "Rubber",
      "Composite",
      "Wood",
      "Ceramic",
      "Glass",
    ],
  },
  { key: "finish", label: "Finish", type: "text", filterable: false },
];
