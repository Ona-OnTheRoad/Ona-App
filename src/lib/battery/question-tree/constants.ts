import type { BatteryOption } from "./types";

export const BATTERY_START_QUESTION =
  "What is the main battery or starting problem you are experiencing?";

export const BATTERY_FINAL_COPY = {
  urgency: "Urgency",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos:
    "Add clear photos (at most 4) of the battery, terminals, and dashboard",
  voice: "Record a short voice note describing the problem",
  location: "Current Location",
  extra: "Any other detail you want the technician to know?",
  diagnosis: "Likely problem",
  tow: "Do you need the vehicle towed to a safer place or workshop?",
} as const;

export const BATTERY_MIN_PHOTOS = 0;
export const BATTERY_MAX_PHOTOS = 4;

export const BATTERY_START_OPTIONS: BatteryOption[] = [
  {
    id: "A",
    label: "Vehicle is completely dead (no lights, no sound)",
  },
  {
    id: "B",
    label: "Lights come on but engine does not crank",
  },
  {
    id: "C",
    label: "Engine cranks very slowly or weakly",
  },
  {
    id: "D",
    label: "Battery keeps going flat / needs frequent jump-starts",
  },
  { id: "E", label: "Need battery testing or replacement" },
  {
    id: "F",
    label: "Battery warning light is on while driving",
  },
  { id: "G", label: "Something else / I'm not sure" },
  {
    id: "H",
    label: "Electric vehicle (EV) battery problem",
  },
];

export const YES_NO: BatteryOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];

export const YES_NO_UNSURE: BatteryOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "unsure", label: "I'm not sure" },
];
