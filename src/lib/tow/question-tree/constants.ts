export const TOW_START_QUESTION = "Why do you need towing service?";

export const TOW_FINAL_COPY = {
  urgency: "Urgency",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos:
    "Add clear photos (minimum 2) of the vehicle and its current position",
  voice: "Record a short voice note describing the situation",
  location: "Exact location / landmark",
  destination: "Preferred destination (workshop name or area)?",
  colour: "Vehicle colour",
  extra: "Any other detail you want the tow operator to know?",
  meetPro: "Do you also need a repair pro to meet you at the destination?",
  meetProYes: "Yes, also send a repair pro",
  meetProNo: "No, proceed with Tow only",
} as const;

export const TOW_MIN_PHOTOS = 2;
export const TOW_MAX_PHOTOS = 4;
