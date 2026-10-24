import type { ProService } from "@/lib/types";

/** Trade ids only no icons. Safe for the first client paint. */
export const ALL_PRO_SERVICES: ProService[] = [
  "mechanic",
  "vulcanizer",
  "towing",
  "battery",
  "ac",
  "body",
  "electrical",
  "diagnostics",
  "fashion",
  "plumber",
  "carpenter",
  "painter",
  "solar",
  "generator",
];

export const PRO_SERVICE_LABELS: Record<ProService, string> = {
  mechanic: "Mechanic",
  vulcanizer: "Vulcanizer",
  towing: "Tow",
  battery: "Battery",
  ac: "A/C",
  body: "Body",
  electrical: "Electrical",
  diagnostics: "Diagnostics",
  fashion: "Fashion Designer",
  plumber: "Plumber",
  carpenter: "Carpenter",
  painter: "Painter",
  solar: "Solar",
  generator: "Generator",
};

export function isProService(v: string): v is ProService {
  return (ALL_PRO_SERVICES as readonly string[]).includes(v);
}

/** Formats a pro skill or trade cleanly without suffix (e.g. "Mechanic", "Vulcanizer"). */
export function formatProSkill(
  skill: ProService | string | null | undefined,
): string {
  const raw = String(skill || "")
    .trim()
    .toLowerCase();
  if (raw && isProService(raw)) {
    return PRO_SERVICE_LABELS[raw];
  }
  if (raw) {
    const pretty = raw
      .split(/[\s_/|-]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    if (pretty) return pretty;
  }
  return "Mechanic";
}
