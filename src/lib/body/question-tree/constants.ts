export const BODY_START_QUESTION =
  "What is the main body or panel problem you are experiencing?";

export const BODY_FINAL_COPY = {
  urgency: "How urgent is this request?",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos: "Add 4 clear photos of the damaged area from different angles",
  voice: "Record a short voice note describing the damage",
  location: "Where is the vehicle?",
  extra: "Any other detail you want the technician to know?",
  tow: "Do you need the vehicle towed to a safer place or workshop?",
} as const;

export const BODY_MIN_PHOTOS = 4;
export const BODY_MAX_PHOTOS = 4;
