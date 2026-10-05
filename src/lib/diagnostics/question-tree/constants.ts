export const SCAN_START_QUESTION = "Why do you need a diagnostic scan?";

export const SCAN_FINAL_COPY = {
  urgency: "How urgent is this request?",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos:
    "Add clear photos of the dashboard (warning lights) and engine bay if possible",
  voice: "Record a short voice note describing the symptoms",
  location: "Exact location / landmark",
  extra: "Any other detail you want the diagnostic technician to know?",
  tow: "Do you need the vehicle towed to a safer place or workshop for the scan?",
} as const;

export const SCAN_MIN_PHOTOS = 1;
export const SCAN_MAX_PHOTOS = 4;
