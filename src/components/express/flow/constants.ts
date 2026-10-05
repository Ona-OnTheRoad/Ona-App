export const SCHEDULE_MAX_MS = 7 * 24 * 60 * 60 * 1000;

export const TRADE_LABEL: Record<string, string> = {
  mechanic: "Mechanic",
  vulcanizer: "Vulcanizer",
  towing: "Tow expert",
  battery: "Battery expert",
  ac: "A/C expert",
  body: "Body expert",
  electrical: "Auto electrician",
  diagnostics: "Scan expert",
};

export const URGENCY_OPTIONS = [
  { id: "normal", label: "Normal", mult: "1" },
  { id: "emergency", label: "Urgent", mult: "1.25" },
  { id: "remote", label: "Remote", mult: "1.35" },
  { id: "night", label: "Night", mult: "1.5" },
] as const;

export const URGENCY_LABEL: Record<string, string> = {
  normal: "Normal",
  emergency: "Urgent",
  remote: "Remote",
  night: "Night",
};
