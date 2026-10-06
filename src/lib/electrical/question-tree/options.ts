import type { ElectricalOption } from "./types";

export const ELECTRICAL_START_OPTIONS: ElectricalOption[] = [
  { id: "A", label: "Vehicle electrical issue" },
  { id: "B", label: "Residential (Home) electrical issue" },
  { id: "C", label: "Commercial (Shop / Office) electrical issue" },
  { id: "D", label: "Industrial electrical issue" },
  { id: "E", label: "Something else / I'm not sure" },
];

export const YES_NO: ElectricalOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
