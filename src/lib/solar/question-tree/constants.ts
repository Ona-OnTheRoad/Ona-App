/** Deep cascading question flow for the Solar trade. */

export const SOLAR_MACHINE_QUESTION = "What type of solar system do you use?";
export const SOLAR_MACHINE_NONE_ID = "none";
export const SOLAR_MACHINE_OTHER_ID = "other";

export const SOLAR_START_QUESTION = "What kind of solar work do you need?";

export const SOLAR_MIN_PHOTOS = 2;
export const SOLAR_MAX_PHOTOS = 4;

export const SOLAR_FINAL_COPY = {
  urgency: "How urgent is the work?",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos:
    "Add clear photos (2-4): existing solar panels / inverter / batteries (if any), the roof or installation area, and distribution board (if relevant)",
  voice: "Record a short voice note explaining exactly what you need",
  location: "Exact location / landmark",
  load: "Estimated load or what you want to power",
  supply: "Who is supplying the equipment?",
  extra: "Any other detail you want the solar technician to know?",
};
