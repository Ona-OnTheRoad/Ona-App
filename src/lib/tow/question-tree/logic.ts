import type { ProService } from "@/lib/types";
import { qaLinesForPath } from "@/lib/help-flow-progress";
import { TOW_FINAL_COPY, TOW_MIN_PHOTOS } from "./constants";
import { TOW_SCREENS } from "./screens";
import type { TowRoute, TowScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_what",
  B: "b_serious",
  C: "c_location",
  D: "d_count",
  E: "e_reason",
  F: "f_deep",
  G: "g_desc",
};

export function resolveScreen(
  answers: Record<string, string>,
): "confirm" | "final" {
  return resolveTowRoute(answers).needsConfirm ? "confirm" : "final";
}

export function towScreen(id: string): TowScreen | undefined {
  return TOW_SCREENS[id];
}

export function nextTowScreen(
  current: string,
  answerId: string,
  answers: Record<string, string>,
): string {
  if (current === "start") return START_NEXT[answerId] || "g_desc";

  if (current === "a_what") return "a_roll";
  if (current === "a_roll") return "a_safe";
  if (current === "a_safe") return "a_vehicle";
  if (current === "a_vehicle") return resolveScreen(answers);

  if (current === "b_serious") return "b_injured";
  if (current === "b_injured") return "b_parts";
  if (current === "b_parts") return "b_blocking";
  if (current === "b_blocking") return "b_paint";
  if (current === "b_paint") return resolveScreen(answers);

  if (current === "c_location") return "c_hazard";
  if (current === "c_hazard") return "c_drive";
  if (current === "c_drive") return resolveScreen(answers);

  if (current === "d_count") return "d_spare";
  if (current === "d_spare") return "d_tools";
  if (current === "d_tools") return "d_safe";
  if (current === "d_safe") return resolveScreen(answers);

  if (current === "e_reason") return "e_drive";
  if (current === "e_drive") return resolveScreen(answers);

  if (current === "f_deep") return "f_recovery";
  if (current === "f_recovery") return "f_vehicle";
  if (current === "f_vehicle") return resolveScreen(answers);

  if (current === "g_desc") return "g_related";
  if (current === "g_related") {
    if (answerId === "power") return "g_power";
    if (answerId === "house") return "g_house";
    return resolveScreen(answers);
  }
  if (current === "g_power" || current === "g_house") {
    return resolveScreen(answers);
  }

  return "final";
}

/**
 * Pick the trade from the filled answers. Most branches stay with Tow and let
 * the final "meet a repair pro at the destination" question handle follow-up
 * pros (Mechanic / Vulcanizer / Body / etc.). Branch D prefers Vulcanizer for
 * a single safe tyre; Branch G offers the related trade for odd requests.
 */
export function resolveTowRoute(answers: Record<string, string>): TowRoute {
  const stay = (extra?: Partial<TowRoute>): TowRoute => ({
    trade: "towing",
    needsConfirm: false,
    ...extra,
  });
  const leave = (
    trade: ProService,
    alternate?: ProService,
    extra?: Partial<TowRoute>,
  ): TowRoute => ({
    trade,
    alternate,
    needsConfirm: true,
    ...extra,
  });

  const main = answers.start;

  if (main === "A") return stay();
  if (main === "B") return stay();
  if (main === "C") return stay({ emergency: true });

  if (main === "D") {
    const safeSingle = answers.d_count === "one" && answers.d_safe === "safe";
    if (safeSingle) return leave("vulcanizer", "towing");
    return leave("towing", "vulcanizer");
  }

  if (main === "E") return stay();
  if (main === "F") return stay();

  if (main === "G") {
    if (answers.g_related === "engine_mech") return leave("towing", "mechanic");
    if (answers.g_related === "tyre_wheel")
      return leave("towing", "vulcanizer");
    if (answers.g_related === "battery_electrical")
      return leave("towing", "battery");
    if (answers.g_related === "body") return leave("towing", "body");
    if (answers.g_related === "ac") return leave("towing", "ac");
    if (answers.g_related === "power") {
      if (answers.g_power === "solar") return leave("towing", "solar");
      return leave("towing", "generator");
    }
    if (answers.g_related === "house") {
      if (answers.g_house === "plumber") return leave("towing", "plumber");
      if (answers.g_house === "painter") return leave("towing", "painter");
      return leave("towing", "carpenter");
    }
    if (answers.g_related === "clothing") return leave("towing", "fashion");
    return stay();
  }

  return stay();
}

export function applyTowConfirmChoice(
  route: TowRoute,
  yes: boolean,
): ProService {
  if (yes) return route.trade;
  if (route.alternate) return route.alternate;
  return "towing";
}

export function composeTowProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
  opts?: {
    destination?: string;
    colour?: string;
  },
): string {
  const lines = qaLinesForPath({
    answers,
    next: nextTowScreen,
    screenOf: towScreen,
  });

  if (answers.start === "F" && answers.f_recovery === "heavy") {
    lines.push("Heavy-duty / winch recovery needed");
  }
  if (answers.start === "B" && answers.b_injured === "yes") {
    lines.push("There are injuries on site treat with priority");
  }
  if (answers.start === "B" && answers.b_paint === "yes") {
    lines.push("Damaged panels need repainting a Painter may follow up");
  }

  if (landmark.trim()) {
    lines.push(TOW_FINAL_COPY.location);
    lines.push(landmark.trim());
  }
  if (opts?.destination?.trim()) {
    lines.push(TOW_FINAL_COPY.destination);
    lines.push(opts.destination.trim());
  }
  if (opts?.colour?.trim()) {
    lines.push(TOW_FINAL_COPY.colour);
    lines.push(opts.colour.trim());
  }
  if (extra.trim()) {
    lines.push(TOW_FINAL_COPY.extra);
    lines.push(extra.trim());
  }
  return lines.filter(Boolean).join("\n");
}

export function canFindTowPro(photoCount: number): boolean {
  return photoCount >= TOW_MIN_PHOTOS;
}
