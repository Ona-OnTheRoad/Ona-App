import type { SolarOption } from "./types";

export const SOLAR_START_OPTIONS: SolarOption[] = [
  { id: "A", label: "New solar installation" },
  { id: "B", label: "Existing solar system not working properly" },
  { id: "C", label: "Battery or inverter problem" },
  { id: "D", label: "Solar panel cleaning or maintenance" },
  { id: "E", label: "System upgrade or expansion" },
  { id: "F", label: "Something else / I’m not sure" },
];

export const SOLAR_SUPPLY_OPTIONS: SolarOption[] = [
  { id: "i-will-supply", label: "I will supply" },
  { id: "technician-supplies", label: "Solar technician should supply" },
];
