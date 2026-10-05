import type { CarpenterOption } from "./types";

export const CARPENTER_START_QUESTION =
  "What kind of furniture or carpentry work do you need?";

export const CARPENTER_MIN_PHOTOS = 2;
export const CARPENTER_MAX_PHOTOS = 4;

export const CARPENTER_START_OPTIONS: CarpenterOption[] = [
  { id: "A", label: "New furniture making" },
  { id: "B", label: "Furniture repair or restoration" },
  { id: "C", label: "Doors, windows and door frames" },
  { id: "D", label: "Roofing, ceiling or woodwork in the house" },
  { id: "E", label: "Kitchen cabinets, wardrobe or storage" },
  { id: "F", label: "Office, shop, church or commercial furniture" },
  { id: "G", label: "Roadside, market stall or temporary structure" },
  { id: "H", label: "General carpentry and other woodworks" },
  { id: "I", label: "Something else / I’m not sure" },
];

export const CARPENTER_FINAL_COPY = {
  urgency: "How urgent is the work?",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service / weekend work needed",
  photos:
    "Add clear photos (2-4): the space or existing furniture, design or style inspiration, and wood or materials if you already have them",
  voice: "Record a short voice note explaining exactly what you want",
  location: "Exact location / landmark",
  measurements: "Do you need the carpenter to come and take measurements?",
  extra: "Any other detail you want the furniture maker to know?",
};

export const CARPENTER_MEASUREMENTS_OPTIONS: CarpenterOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
