import type { ProService } from "@/lib/types";

export const MAX_SPECIALTIES = 6;
export const MAX_SPECIALTIES_OTHER = 4;

export function specialtyMaxForSkill(skill: ProService): number {
  return skill === "mechanic" ? MAX_SPECIALTIES : MAX_SPECIALTIES_OTHER;
}

/**
 * Specialties are strictly per skill. Never mixed across trades.
 * Compact labels, equal boxes, fit on one screen.
 */
/**
 * Core focus tags (strongholds) within each profession.
 * Selecting a skill means the pro can do ALL work in that trade;
 * these tags only highlight their strongest areas.
 */
export const SPECIALTIES_BY_SKILL: Record<ProService, readonly string[]> = {
  mechanic: [
    "Engine",
    "Brakes",
    "Suspension",
    "Clutch",
    "Gearbox",
    "Steering service",
    "Roadside service",
    "Cooling",
    "Exhaust",
    "Fuel system",
    "Belts & pulleys",
    "General service",
  ],
  vulcanizer: [
    "Puncture",
    "Tyre change",
    "Wheel balance",
    "Alignment",
    "Inflation",
    "TPMS",
    "Tubeless repair",
    "Spare mount",
  ],
  towing: [
    "Flatbed",
    "Wheel lift",
    "Winch",
    "Breakdown",
    "Accident",
    "Long distance",
    "Motorcycle tow",
    "Heavy recovery",
  ],
  battery: [
    "Jump start",
    "Battery replace",
    "Battery test",
    "Charging",
    "Terminal clean",
    "AGM battery",
  ],
  /**
   * Specialty-picker trades: labels MUST match ARTISAN_TRADE_CATALOG
   * so signup focus + home Home/Office chips + skill flow stay aligned.
   */
  ac: ["Vehicle", "Residential (Homes)", "Commercial", "Industrial"],
  body: [
    "Dent repair",
    "Panel beat",
    "Spray paint",
    "Bumper",
    "Windscreen",
    "Rust work",
    "Polish",
  ],
  electrical: [
    "Vehicle",
    "Residential (Homes)",
    "Commercial",
    "Industrial",
    "Electronics",
    "Mobile",
  ],
  diagnostics: [
    "OBD scan",
    "Engine light",
    "ABS light",
    "Airbag light",
    "Coding",
    "Live data",
    "ECU check",
  ],
  fashion: [
    "Bespoke tailoring",
    "Alterations",
    "Bridal wear",
    "Corporate wear",
    "Dress making",
    "Embroidery",
    "Native/traditional wear",
  ],
  plumber: [
    "Residential (Homes)",
    "Offices",
    "Commercial Plumbing",
    "Industrial Plumbing",
  ],
  carpenter: [
    "Residential (Homes)",
    "Offices",
    "Commercial Carpentry",
    "Industrial Carpentry",
    "Furniture & Fit-out",
  ],
  painter: [
    "Residential (Homes)",
    "Offices",
    "Commercial Painting",
    "Industrial Painting",
    "Exterior / Facade",
  ],
  solar: [
    "Residential (Homes)",
    "Offices",
    "Commercial Solar",
    "Industrial Solar",
  ],
  generator: [
    "Residential (Homes)",
    "Offices",
    "Commercial Generators",
    "Industrial Generators",
  ],
};

/** @deprecated use SPECIALTIES_BY_SKILL.mechanic */
export const CORE_SPECIALTIES = SPECIALTIES_BY_SKILL.mechanic;
