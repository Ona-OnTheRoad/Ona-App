import type { ScanOption } from "./types";

export const SCAN_START_OPTIONS: ScanOption[] = [
  { id: "A", label: "Check engine light or warning light is on" },
  {
    id: "B",
    label:
      "Vehicle has performance problems (loss of power, rough running, etc.)",
  },
  { id: "C", label: "Vehicle will not start or starts with difficulty" },
  { id: "D", label: "Need full system health check / preventive scan" },
  { id: "E", label: "After repairs, want to clear codes or confirm fix" },
  { id: "F", label: "Something else / I'm not sure" },
  {
    id: "G",
    label: "Electric vehicle (EV), battery / motor / charging scan",
  },
];

export const YES_NO: ScanOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
