import type { ProService } from "@/lib/types";
import { batteryDiagnosis } from "./diagnosis";
import type { BatteryRoute } from "./types";

/**
 * Pick the trade from the filled answers. Dangerous locations always route to
 * Tow first. Cross-trade forks pick the stronger one first with a confirm card;
 * staying on Battery is seamless.
 */
export function resolveBatteryRoute(
  answers: Record<string, string>,
): BatteryRoute {
  const diagnosis = batteryDiagnosis(answers);
  const stay = (): BatteryRoute => ({
    trade: "battery",
    needsConfirm: false,
    diagnosis,
  });
  const leave = (trade: ProService, alternate?: ProService): BatteryRoute => ({
    trade,
    alternate,
    needsConfirm: trade !== "battery" || Boolean(alternate),
    diagnosis,
  });

  if (answers.a_safe === "no" || answers.b_safe === "no") {
    return leave("towing");
  }

  const main = answers.start;

  if (main === "A") {
    // Corroded / loose terminals: also offer Electrical (wiring check).
    if (answers.a_terminals === "no") return leave("battery", "electrical");
    return stay();
  }

  if (main === "B") {
    // Persistent clicking or no response after a new battery → not the battery.
    if (answers.b_recent === "yes") return leave("electrical", "battery");
    return stay();
  }

  if (main === "C") return stay();

  if (main === "D") {
    // Charging system problem (warning light while driving) → Electric first.
    if (answers.d_warning === "yes") return leave("electrical", "battery");
    return stay();
  }

  if (main === "E") return stay();

  if (main === "F") return leave("electrical", "battery");

  if (main === "G") {
    if (answers.g_related === "engine") return leave("mechanic");
    if (answers.g_related === "tyre") return leave("vulcanizer");
    if (answers.g_related === "towing") return leave("towing");
    if (answers.g_related === "body") return leave("body");
    if (answers.g_related === "ac") return leave("ac");
    if (answers.g_related === "electrical") return leave("electrical");
    if (answers.g_related === "power") {
      if (answers.g_power === "solar") return leave("solar");
      return leave("generator");
    }
    if (answers.g_related === "house") {
      if (answers.g_house === "plumber") return leave("plumber");
      if (answers.g_house === "painter") return leave("painter");
      return leave("carpenter");
    }
    if (answers.g_related === "clothing") return leave("fashion");
    return stay();
  }

  if (main === "H") {
    if (answers.ev_type === "charging") return leave("electrical", "battery");
    if (answers.ev_type === "hv") return stay();
    if (answers.ev_type === "12v") return stay();
    return stay();
  }

  return stay();
}

export function applyConfirmChoice(
  route: BatteryRoute,
  yes: boolean,
): ProService {
  if (yes) return route.trade;
  if (route.alternate) return route.alternate;
  return "battery";
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
