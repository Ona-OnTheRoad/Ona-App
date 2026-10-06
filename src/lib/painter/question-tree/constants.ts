import type { PainterOption } from "./types";

export const PAINTER_START_QUESTION = "What kind of painting work do you need?";

export const PAINTER_MIN_PHOTOS = 2;
export const PAINTER_MAX_PHOTOS = 4;

export const PAINTER_START_OPTIONS: PainterOption[] = [
  { id: "A", label: "Residential house painting" },
  { id: "B", label: "Commercial / Shop / Office painting" },
  { id: "C", label: "Industrial / Factory / Warehouse painting" },
  { id: "D", label: "Roadside, market stall or kiosk painting" },
  { id: "E", label: "Gate, fence, railing or burglary proof" },
  { id: "F", label: "Roof painting" },
  { id: "G", label: "Church, school, mosque or public building" },
  { id: "H", label: "Sign writing, branding or wall design" },
  { id: "I", label: "Something else / I’m not sure" },
];

export const PAINTER_FINAL_COPY = {
  urgency: "How urgent is the work?",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service / weekend work needed",
  photos: "Add clear photos of the area to be painted (2-4)",
  voice: "Record a short voice note explaining exactly what you want",
  location: "Exact location / landmark",
  supply: "Who is supplying the paint and materials?",
  scaffold: "Do you need the painter to bring scaffolding or ladder?",
  extra: "Any other detail you want the painter to know?",
};

export const PAINTER_SUPPLY_OPTIONS: PainterOption[] = [
  { id: "i-will-supply", label: "I will supply" },
  { id: "painter-supplies", label: "Painter should supply" },
];

export const PAINTER_SCAFFOLD_OPTIONS: PainterOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
