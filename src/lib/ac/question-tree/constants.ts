export const AC_START_QUESTION =
  "What is the main air-conditioning problem you are experiencing?";

export const AC_UNIT_QUESTION = "Is this a vehicle A/C or a home/office A/C?";

export const AC_FINAL_COPY = {
  urgency: "Urgency",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos:
    "Add clear photos (if accessible) of the A/C controls, vents, or outdoor unit",
  voice: "Record a short voice note describing the problem or the noise",
  location: "Current Location",
  extra: "Any other detail you want the technician to know?",
} as const;

export const AC_MIN_PHOTOS = 0;
export const AC_MAX_PHOTOS = 4;
