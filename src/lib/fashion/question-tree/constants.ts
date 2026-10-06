export const FASHION_START_QUESTION =
  "What fashion or tailoring service do you need?";

export const FASHION_FINAL_COPY = {
  urgency: "How urgent is this request?",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos:
    "Add clear photos (minimum 2-4): style inspiration, fabric, or the current garment",
  voice:
    "Record a short voice note describing the exact style, event, or preference",
  location: "Exact location / landmark",
  extra: "Any other detail you want the tailor / fashion designer to know?",
  home: "Do you need home service (measurement or delivery) or will you visit the tailor?",
} as const;

export const FASHION_MIN_PHOTOS = 2;
export const FASHION_MAX_PHOTOS = 4;
