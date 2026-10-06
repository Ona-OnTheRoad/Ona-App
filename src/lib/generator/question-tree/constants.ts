/** First screen searchable Type → Brand → Model catalog. */
export const GEN_MACHINE_QUESTION = "What type of Generator do you use?";
export const GEN_MACHINE_NONE_ID = "none";
export const GEN_MACHINE_OTHER_ID = "other";

export const GEN_START_QUESTION = "What kind of generator work do you need?";

export const GEN_MIN_PHOTOS = 2;
export const GEN_MAX_PHOTOS = 4;

export const GEN_SUPPLY_OPTIONS = [
  { id: "i-will-supply", label: "I will supply parts / new generator" },
  { id: "technician-supplies", label: "Technician should supply" },
] as const;

export const GEN_FINAL_COPY = {
  urgency: "How urgent is this?",
  photos:
    "Add clear photos of the generator, control panel and change-over switch",
  voice:
    "Record a short voice note explaining the problem or the sound it is making",
  location: "Where should the technician come to?",
  extra: "Any other detail you want the technician to know?",
  size: "Generator size (kVA) and type (petrol/diesel) if known",
  supply: "Who is supplying parts or the new generator?",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
} as const;
