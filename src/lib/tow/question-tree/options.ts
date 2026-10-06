import type { TowOption } from "./types";

export const TOW_START_OPTIONS: TowOption[] = [
  { id: "A", label: "Vehicle completely broken down and cannot move" },
  { id: "B", label: "Accident or collision" },
  {
    id: "C",
    label:
      "Vehicle is in a dangerous location (highway, middle of the road, etc.)",
  },
  { id: "D", label: "Flat or burst tyre(s) and I cannot change it" },
  { id: "E", label: "Need to move the vehicle to a workshop or safer place" },
  { id: "F", label: "Vehicle sank, stuck in mud, sand or ditch" },
  { id: "G", label: "Something else / I'm not sure" },
];

export const YES_NO: TowOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];

export const VEHICLE_TYPES: TowOption[] = [
  { id: "saloon", label: "Saloon / Car" },
  { id: "suv", label: "SUV / Crossover" },
  { id: "bus", label: "Bus / Van" },
  { id: "pickup", label: "Pickup / Truck" },
  { id: "other", label: "Other" },
];

export const BODY_PARTS: TowOption[] = [
  { id: "front", label: "Front (bumper, bonnet, lights)" },
  { id: "rear", label: "Rear (bumper, boot)" },
  { id: "side", label: "Side doors / panels" },
  { id: "wheels", label: "Wheels / suspension" },
  { id: "undercarriage", label: "Undercarriage / chassis" },
  { id: "multiple", label: "Multiple areas" },
  { id: "not_sure", label: "I'm not sure" },
];
