/** Deep cascading question flow for the Plumber trade. */

export const PLUMBER_START_QUESTION =
  "What is the main plumbing problem you are experiencing?";

export const PLUMBER_MIN_PHOTOS = 2;
export const PLUMBER_MAX_PHOTOS = 4;

export const PLUMBER_FINAL_COPY = {
  urgency: "How urgent is the plumbing problem?",
  normal: "Normal",
  emergency: "Emergency",
  remote: "Remote location",
  night: "Night service needed",
  photos:
    "Add clear photos of the affected area, leaking point, or blocked section (2-4)",
  voice: "Record a short voice note describing the problem",
  location: "Exact location / landmark",
  property: "Type of property (house, flat, shop, office, or other)?",
  extra: "Any other detail you want the plumber to know?",
};
