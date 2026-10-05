import type { VulcanizerOption } from "./types";

export const VULCANIZER_START_QUESTION =
  "What is the main tyre or wheel problem you are experiencing?";

export const VULCANIZER_FINAL_COPY = {
  urgency: "Urgency",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos: "Add clear photos of the affected tyre(s) and rim(s)",
  voice: "Record a short voice note describing the problem",
  location: "Current Location",
  extra: "Any other detail you want the repair pro to know?",
  diagnosis: "Likely problem",
  tow: "Do you need the vehicle towed to a safer place or workshop?",
  towYes: "Yes I need a tow",
  towNo: "No proceed with Vulcanizer",
} as const;

export const VULCANIZER_MIN_PHOTOS = 0;
export const VULCANIZER_MAX_PHOTOS = 4;

export const VULCANIZER_START_OPTIONS: VulcanizerOption[] = [
  { id: "A", label: "Flat tyre / puncture" },
  { id: "B", label: "Burst or blown tyre" },
  { id: "C", label: "Tyre losing air slowly (slow puncture)" },
  { id: "D", label: "Damaged, bent or cracked rim / wheel" },
  { id: "E", label: "Need wheel balancing or alignment" },
  { id: "F", label: "Need new tyre(s) or tyre replacement" },
  { id: "G", label: "Multiple tyres affected" },
  { id: "H", label: "Something else / I'm not sure" },
];

export const YES_NO: VulcanizerOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];

export const TYRE_POSITIONS: VulcanizerOption[] = [
  { id: "front_left", label: "Front left" },
  { id: "front_right", label: "Front right" },
  { id: "rear_left", label: "Rear left" },
  { id: "rear_right", label: "Rear right" },
  { id: "spare", label: "Spare" },
];
