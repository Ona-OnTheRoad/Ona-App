import type { ProService } from "@/lib/types";
import { qaLinesForPath } from "@/lib/help-flow-progress";
import { SCAN_FINAL_COPY, SCAN_MIN_PHOTOS } from "./constants";
import { SCAN_SCREENS } from "./screens";
import type { ScanRoute, ScanScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_light",
  B: "b_what",
  C: "c_what",
  D: "d_routine",
  E: "e_repair",
  F: "f_describe",
  G: "ev_scan",
};

export function resolveScreen(
  answers: Record<string, string>,
): "confirm" | "final" {
  return resolveScanRoute(answers).needsConfirm ? "confirm" : "final";
}

export function scanScreen(id: string): ScanScreen | undefined {
  return SCAN_SCREENS[id];
}

export function nextScanScreen(
  current: string,
  answerId: string,
  answers: Record<string, string>,
): string {
  if (current === "start") return START_NEXT[answerId] || "f_describe";

  if (current === "a_light") return "a_flash";
  if (current === "a_flash") return "a_when";
  if (current === "a_when") return "a_symptoms";
  if (current === "a_symptoms") return "a_scanned";
  if (current === "a_scanned") return resolveScreen(answers);

  if (current === "b_what") return "b_when";
  if (current === "b_when") return "b_noise";
  if (current === "b_noise") return "b_lights";
  if (current === "b_lights") return resolveScreen(answers);

  if (current === "c_what") return "c_lights";
  if (current === "c_lights") return "c_sudden";
  if (current === "c_sudden") return "c_work";
  if (current === "c_work") return resolveScreen(answers);

  if (current === "d_routine") return "d_symptoms";
  if (current === "d_symptoms") return "d_scope";
  if (current === "d_scope") return resolveScreen(answers);

  if (current === "e_repair") return "e_light";
  if (current === "e_light") return "e_clear";
  if (current === "e_clear") return resolveScreen(answers);

  if (current === "f_describe") return "f_related";
  if (current === "f_related") {
    if (answerId === "power") return "f_power";
    if (answerId === "house") return "f_house";
    return resolveScreen(answers);
  }
  if (current === "f_power" || current === "f_house") {
    return resolveScreen(answers);
  }

  if (current === "ev_scan") return resolveScreen(answers);

  return "final";
}

/**
 * Pick the trade from the filled answers. Deep routing matches the Scan
 * template: charging light → Battery + Electric, temperature/oil → Mechanic,
 * flashing check-engine → Priority Scan + Mechanic, dead/slow crank →
 * Battery first, crank-no-start → Scan + Mechanic, and the something-else
 * branch routes to any specialist. Confirm cards are shown whenever the
 * scan would hand the job to another trade.
 */
export function resolveScanRoute(answers: Record<string, string>): ScanRoute {
  const stay = (): ScanRoute => ({
    trade: "diagnostics",
    needsConfirm: false,
  });
  const leave = (trade: ProService, alternate?: ProService): ScanRoute => ({
    trade,
    alternate,
    needsConfirm: trade !== "diagnostics" || Boolean(alternate),
  });

  const main = answers.start;

  if (main === "A") {
    const light = answers.a_light;
    // Battery / charging light → Offer Battery + Electric.
    if (light === "battery") return leave("battery", "electrical");
    // Oil pressure / Temperature → Mechanic (lubrication / cooling).
    if (light === "oil" || light === "temp") return leave("mechanic");
    // Flashing Check Engine → Priority Scan + Mechanic (possible catalytic/misfire damage).
    if (light === "ce" && answers.a_flash === "flashing") {
      return leave("diagnostics", "mechanic");
    }
    // Check Engine (steady), ABS / traction, Airbag, Other → stay with Scan.
    return stay();
  }

  if (main === "B") return stay();

  if (main === "C") {
    const what = answers.c_what;
    // Completely dead or slow crank → Offer Battery first, then Scan / Electric.
    if (what === "dead" || what === "slow")
      return leave("battery", "electrical");
    // Cranks but does not start → Scan + Mechanic or Electric.
    if (what === "crank") return leave("diagnostics", "mechanic");
    // Starts then dies immediately → stay with Scan.
    return stay();
  }

  if (main === "D") return stay();

  if (main === "E") return stay();

  if (main === "F") {
    if (answers.f_related === "tyre") return leave("vulcanizer");
    if (answers.f_related === "body") return leave("body");
    if (answers.f_related === "ac") return leave("ac");
    if (answers.f_related === "battery") return leave("battery");
    if (answers.f_related === "tow") return leave("towing");
    if (answers.f_related === "power") {
      if (answers.f_power === "solar") return leave("solar");
      if (answers.f_power === "electric") return leave("electrical");
      return leave("generator");
    }
    if (answers.f_related === "house") {
      if (answers.f_house === "plumber") return leave("plumber");
      if (answers.f_house === "painter") return leave("painter");
      return leave("carpenter");
    }
    if (answers.f_related === "clothing") return leave("fashion");
    return stay();
  }

  if (main === "G") {
    if (answers.ev_scan === "charging")
      return leave("diagnostics", "electrical");
    return stay();
  }

  return stay();
}

export function applyConfirmChoice(route: ScanRoute, yes: boolean): ProService {
  if (yes) return route.trade;
  if (route.alternate) return route.alternate;
  return "diagnostics";
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

export function composeScanProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines = qaLinesForPath({
    answers,
    next: nextScanScreen,
    screenOf: scanScreen,
  });

  if (landmark.trim()) {
    lines.push(SCAN_FINAL_COPY.location);
    lines.push(landmark.trim());
  }
  if (extra.trim()) {
    lines.push(SCAN_FINAL_COPY.extra);
    lines.push(extra.trim());
  }
  return lines.filter(Boolean).join("\n");
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length >= 2;
}

export function canFindScanPro(photoCount: number): boolean {
  return photoCount >= SCAN_MIN_PHOTOS;
}

export function scanBreadcrumb(stack: string[]): string {
  const bits: string[] = ["Scan"];
  const firstBranch = stack.find(
    (id) =>
      id !== "vehicle" && id !== "start" && id !== "confirm" && id !== "final",
  );
  if (firstBranch) {
    const letter = Object.entries(START_NEXT).find(
      ([, id]) => id === firstBranch,
    )?.[0];
    if (letter) bits.push(letter);
  }
  const last = stack[stack.length - 1];
  if (last === "confirm") bits.push("Confirm");
  else if (last === "final") bits.push("Send");
  return bits.join(" · ");
}
