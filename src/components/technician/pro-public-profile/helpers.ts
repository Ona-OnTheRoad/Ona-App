import type { Technician } from "@/lib/types";

export function serviceFocusRows(tech: Technician) {
  return (
    [
      ["Vehicle type", tech.servedVehicleType],
      ["Brand", tech.servedBrand || tech.servedMake],
      ["Model", tech.servedModel],
      ["Country", tech.servedCountry],
      ["State / Region", tech.servedLocation],
    ] as const
  ).filter(([, v]) => v && String(v).trim().length > 0);
}

export function experienceLabelFor(tech: Technician) {
  return tech.yearsExperience === "10+"
    ? "10+ years"
    : tech.yearsExperience === "1"
      ? "1 year"
      : tech.yearsExperience
        ? `${tech.yearsExperience} years`
        : null;
}

export function statusTextFor(tech: Technician) {
  return tech.status === "available"
    ? null
    : tech.status === "nearby"
      ? "Nearby"
      : tech.status === "busy"
        ? "Busy"
        : tech.status === "offline"
          ? "Offline"
          : tech.status;
}
