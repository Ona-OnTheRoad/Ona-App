import type { ProService } from "@/lib/types";
import { vulcanizerDiagnosis } from "./diagnosis";
import type { VulcanizerRoute } from "./types";

/**
 * Pick the trade from the filled answers. Tyre problems stay with Vulcanizer
 * unless the vehicle is unsafe, the tyres are beyond a fix, or the answers
 * clearly point to another trade.
 */
export function resolveVulcanizerRoute(
  answers: Record<string, string>,
): VulcanizerRoute {
  const diagnosis = vulcanizerDiagnosis(answers);
  const stay = (): VulcanizerRoute => ({
    trade: "vulcanizer",
    needsConfirm: false,
    diagnosis,
  });
  const leave = (
    trade: ProService,
    alternate?: ProService,
  ): VulcanizerRoute => ({
    trade,
    alternate,
    needsConfirm: true,
    diagnosis,
  });

  const main = answers.start;

  if (main === "A") {
    if (answers.a_which === "more") {
      return answers.g_drive === "no" ? leave("towing") : stay();
    }
    if (answers.a_spare === "no" || answers.a_safe === "road") {
      return leave("towing");
    }
    return stay();
  }

  if (main === "B") {
    if (answers.b_safe === "no" || answers.b_spare === "no") {
      return leave("towing", "vulcanizer");
    }
    if (answers.b_pull === "yes") {
      return leave("mechanic", "vulcanizer");
    }
    return stay();
  }

  if (main === "C") {
    return stay();
  }

  if (main === "D") {
    if (answers.d_use === "unsafe") {
      return leave("towing", "vulcanizer");
    }
    if (answers.d_how === "accident") {
      return leave("body", "vulcanizer");
    }
    return stay();
  }

  if (main === "E") {
    if (answers.e_symptoms === "loose") {
      return leave("mechanic", "vulcanizer");
    }
    return stay();
  }

  if (main === "F") {
    return stay();
  }

  if (main === "G") {
    return answers.g_drive === "no" ? leave("towing") : stay();
  }

  if (main === "H") {
    if (answers.h_related === "engine") return leave("mechanic");
    if (answers.h_related === "battery") return leave("battery", "electrical");
    if (answers.h_related === "body") return leave("body");
    if (answers.h_related === "tow") return leave("towing");
    if (answers.h_related === "power") {
      if (answers.h_power === "solar") return leave("solar");
      return leave("generator");
    }
    if (answers.h_related === "house") {
      if (answers.h_house === "plumber") return leave("plumber");
      if (answers.h_house === "painter") return leave("painter");
      return leave("carpenter");
    }
    if (answers.h_related === "clothing") return leave("fashion");
    return stay();
  }

  return stay();
}

export function applyVulcanizerConfirmChoice(
  route: VulcanizerRoute,
  yes: boolean,
): ProService {
  if (yes) return route.trade;
  if (route.alternate) return route.alternate;
  return "vulcanizer";
}
