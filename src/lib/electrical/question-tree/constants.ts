export const ELECTRICAL_START_QUESTION =
  "What type of electrical problem or service do you need?";

export const ELECTRICAL_FINAL_COPY = {
  urgency: "How urgent is this request?",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos:
    "Add clear photos of the affected area, distribution board, wires, or vehicle engine bay",
  voice: "Record a short voice note describing the problem or any noise/smell",
  location: "Where is the site or vehicle?",
  extra: "Any other detail you want the technician to know?",
  tow: "Do you need the vehicle towed, or is this a pure on-site electrical job?",
} as const;

export const ELECTRICAL_MIN_PHOTOS = 0;
export const ELECTRICAL_MAX_PHOTOS = 4;
