import type { ProService } from "@/lib/types";
import {
  SOLAR_MACHINE_QUESTION,
  SOLAR_MIN_PHOTOS,
  SOLAR_START_QUESTION,
} from "./constants";
import { SOLAR_SCREENS } from "./screens";
import type { SolarRoute, SolarScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_property",
  B: "b_problem",
  C: "c_which",
  D: "d_count",
  E: "e_upgrade",
  F: "f_describe",
};

export function solarScreen(id: string): SolarScreen | undefined {
  return SOLAR_SCREENS[id];
}

/** Advance helper for the choice rows; returns the next screen id or "final". */
export function nextSolarScreen(
  current: string,
  _answerId: string,
  _answers: Record<string, string>,
): string {
  const map: Record<string, string> = {
    a_property: "a_power",
    a_power: "a_system",
    a_system: "a_equipment",
    a_equipment: "a_supply",
    a_supply: "a_roof",
    a_roof: "final",

    b_problem: "b_age",
    b_age: "b_inverter",
    b_inverter: "b_warranty",
    b_warranty: "confirm",

    c_which: "c_symptom",
    c_symptom: "c_type",
    c_type: "c_bank",
    c_bank: "confirm",

    d_count: "d_last",
    d_last: "d_condition",
    d_condition: "d_check",
    d_check: "final",

    e_upgrade: "e_current",
    e_current: "e_load",
    e_load: "final",

    f_describe: "f_location",
    f_location: "confirm",
  };
  if (current === "machine") {
    return "start";
  }
  if (current === "start") {
    return START_NEXT[_answerId] ?? "final";
  }
  return map[current] ?? "final";
}

/**
 * Solar is capture-only except where the problem is clearly pure electrical
 * (wiring / distribution board / inverter electronics) branches B, C and F
 * end with a confirm card offering Electric. No other trade links.
 */
export function resolveSolarRoute(answers: Record<string, string>): SolarRoute {
  const stay = (): SolarRoute => ({
    trade: "solar",
    needsConfirm: false,
  });
  const leave = (trade: ProService, alternate?: ProService): SolarRoute => ({
    trade,
    alternate,
    needsConfirm: trade !== "solar" || Boolean(alternate),
  });

  const main = answers.start;
  if (main === "B" || main === "C" || main === "F") {
    return leave("electrical", "solar");
  }
  return stay();
}

export function applyConfirmChoice(
  route: SolarRoute,
  yes: boolean,
): ProService {
  if (yes) return route.trade;
  if (route.alternate) return route.alternate;
  return "solar";
}

export function confirmQuestion(trade: ProService): string {
  const labels: Record<ProService, string> = {
    mechanic: "Mechanic",
    vulcanizer: "Vulcanizer",
    towing: "Tow",
    battery: "Battery",
    ac: "A/C",
    body: "Body",
    electrical: "Electrical",
    diagnostics: "Diagnostics",
    fashion: "Fashion",
    plumber: "Plumber",
    carpenter: "Carpenter",
    painter: "Painter",
    solar: "Solar",
    generator: "Generator",
  };
  return `This sounds like ${labels[trade]}. Continue?`;
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length > 0;
}

export function canFindSolarPro(photoCount: number): boolean {
  return photoCount >= SOLAR_MIN_PHOTOS;
}

export function composeSolarProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines: string[] = [];
  const machineLabel = answers.machine_label || answers.machine || "";
  if (machineLabel) {
    lines.push(`${SOLAR_MACHINE_QUESTION} ${machineLabel}`);
  }
  const startLabel = answers.start_label || answers.start || "";
  lines.push(`Solar work: ${startLabel} (${SOLAR_START_QUESTION})`);
  const orderedIds = [
    "a_property",
    "a_power",
    "a_system",
    "a_equipment",
    "a_supply",
    "a_roof",
    "b_problem",
    "b_age",
    "b_inverter",
    "b_warranty",
    "c_which",
    "c_symptom",
    "c_type",
    "c_bank",
    "d_count",
    "d_last",
    "d_condition",
    "d_check",
    "e_upgrade",
    "e_current",
    "e_load",
    "f_describe",
    "f_location",
  ];
  for (const id of orderedIds) {
    const value = answers[`${id}_label`] || answers[id];
    if (!value) continue;
    const screen = SOLAR_SCREENS[id];
    if (!screen) continue;
    lines.push(`${screen.question} ${value}`);
  }
  if (landmark.trim()) lines.push(`Location: ${landmark.trim()}`);
  if (extra.trim()) lines.push(`Extra: ${extra.trim()}`);
  return lines.join("\n");
}

export function solarBreadcrumb(stack: string[]): string {
  const step = stack[stack.length - 1];
  if (!step || step === "start" || step === "machine") return "Solar";
  if (step === "final") return "Solar · Send";
  return `Solar · ${step.charAt(0).toUpperCase()}`;
}
