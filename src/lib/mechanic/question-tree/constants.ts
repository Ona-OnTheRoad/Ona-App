import type { MechanicOption } from "./types";

export const MECHANIC_START_QUESTION = "What's wrong with your vehicle?";

export const MECHANIC_FINAL_COPY = {
  urgency: "Urgency",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos: "Add clear photos (at most 4)",
  voice: "Record a short voice note describing the problem",
  location: "Current Location",
  extra: "Any other detail you want the repair pro to know?",
  diagnosis: "Likely problem",
} as const;

export const MECHANIC_MIN_PHOTOS = 0;
export const MECHANIC_MAX_PHOTOS = 4;

export const MECHANIC_START_OPTIONS: MechanicOption[] = [
  { id: "A", label: "The vehicle will not start at all" },
  {
    id: "B",
    label: "The vehicle starts but stops, loses power, or stalls while driving",
  },
  { id: "C", label: "Strange noise coming from the vehicle" },
  { id: "D", label: "Overheating or temperature warning" },
  { id: "E", label: "Smoke, burning smell, or unusual smell" },
  { id: "F", label: "Fluid leak (oil, water, fuel, etc.)" },
  { id: "G", label: "Transmission / gear / clutch problem" },
  { id: "H", label: "Electric vehicle (EV) problem" },
  { id: "I", label: "Something else / I am not sure" },
];

export const YES_NO: MechanicOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
