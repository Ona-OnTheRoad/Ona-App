import type { ProService } from "@/lib/types";
import { mechanicDiagnosis } from "./diagnosis";
import type { MechanicRoute } from "./types";

/**
 * Pick the trade from the filled answers. Leaving Mechanic always
 * needs a confirm card. Two-trade forks pick the stronger one first.
 */
export function resolveMechanicRoute(
  answers: Record<string, string>,
): MechanicRoute {
  const diagnosis = mechanicDiagnosis(answers);
  const stay = (): MechanicRoute => ({
    trade: "mechanic",
    needsConfirm: false,
    diagnosis,
  });
  const leave = (trade: ProService, alternate?: ProService): MechanicRoute => ({
    trade,
    alternate,
    needsConfirm: trade !== "mechanic",
    diagnosis,
  });

  // Tow rule: the customer said the vehicle can still move (safe-to-drive
  // answer "yes") → never route to Tow from a driveability answer. A
  // dangerous-location / multi-tyre flag may still warrant Tow on its own.
  const unsafeToDrive =
    answers.b_move === "no" ||
    answers.c_safe === "no" ||
    answers.d_safe === "no" ||
    answers.f_safe === "no" ||
    answers.i_driveable === "no";
  const unsafeLocation =
    answers.a_danger === "yes" || answers.j_multi === "yes";

  if (unsafeToDrive || unsafeLocation) {
    return leave("towing");
  }

  const main = answers.start;

  if (main === "A") {
    const what = answers.a_what;
    const lights = answers.a_lights;
    if (what === "silent" && lights === "none") {
      return leave("battery", "electrical");
    }
    if (what === "lights_no_crank") {
      return leave("electrical", "battery");
    }
    if (what === "weak_crank") {
      return leave("battery");
    }
    if (what === "silent" && lights !== "none") {
      return leave("electrical", "battery");
    }
    return stay();
  }

  if (main === "B") {
    if (answers.b_how === "suddenly" && answers.b_warning === "battery") {
      return leave("electrical", "battery");
    }
    return stay();
  }

  if (main === "C") {
    const picked = answers.part_pick;
    if (
      picked === "brakes" ||
      picked === "steering" ||
      picked === "suspension" ||
      picked === "engine" ||
      picked === "gear" ||
      picked === "exhaust"
    ) {
      return stay();
    }
    if (answers.brk_feel || answers.str_feel || answers.sus_feel) {
      return stay();
    }
    if (
      answers.c_where === "wheels" ||
      answers.c_when === "turning" ||
      answers.c_when === "braking"
    ) {
      return leave("vulcanizer");
    }
    return stay();
  }

  if (main === "D") {
    if (answers.d_ac === "yes") return leave("ac");
    return stay();
  }

  if (main === "E") {
    if (answers.e_color === "smell_only") return leave("electrical");
    return stay();
  }

  if (main === "F") return stay();

  if (main === "G") {
    if (answers.g_what === "no_drive" || answers.g_ev === "no_drive") {
      return leave("towing");
    }
    if (answers.g_type === "electric" || answers.g_ev) {
      return leave("electrical", "mechanic");
    }
    return stay();
  }

  if (main === "H") {
    if (answers.ev_issue === "charging") return leave("electrical", "mechanic");
    if (answers.ev_issue === "battery") return leave("battery", "electrical");
    if (answers.ev_issue === "motor_no_drive") {
      return leave("towing");
    }
    if (answers.ev_issue === "won_t_start")
      return leave("battery", "electrical");
    return stay();
  }

  if (main === "I") {
    if (answers.l_related === "clothing") return leave("fashion");
    if (answers.l_related === "power") {
      if (answers.l_power === "solar") return leave("solar");
      return leave("generator");
    }
    if (answers.l_related === "house") {
      if (answers.l_house === "plumber") return leave("plumber");
      if (answers.l_house === "painter") return leave("painter");
      return leave("carpenter");
    }
    return stay();
  }

  return stay();
}

export function applyConfirmChoice(
  route: MechanicRoute,
  yes: boolean,
): ProService {
  if (yes) return route.trade;
  if (route.alternate) return route.alternate;
  return "mechanic";
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
