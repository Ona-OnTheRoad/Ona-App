import { VULCANIZER_SCREENS } from "./screens";
import { resolveVulcanizerRoute } from "./route";
import type { VulcanizerScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_which",
  B: "b_which",
  C: "c_time",
  D: "d_how",
  E: "e_symptoms",
  F: "f_which",
  G: "g_howmany",
  H: "h_describe",
};

function resolveScreen(answers: Record<string, string>): "confirm" | "final" {
  return resolveVulcanizerRoute(answers).needsConfirm ? "confirm" : "final";
}

export function vulcanizerScreen(id: string): VulcanizerScreen | undefined {
  return VULCANIZER_SCREENS[id];
}

export function nextVulcanizerScreen(
  current: string,
  answerId: string,
  answers: Record<string, string>,
): string {
  if (current === "start") return START_NEXT[answerId] || "h_describe";

  if (current === "a_which") {
    if (answerId === "more") return "g_howmany";
    return "a_object";
  }
  if (current === "a_object") return "a_spare";
  if (current === "a_spare") return "a_jack";
  if (current === "a_jack") return "a_safe";
  if (current === "a_safe") return resolveScreen(answers);

  if (current === "b_which") return "b_pull";
  if (current === "b_pull") return "b_rim";
  if (current === "b_rim") return "b_spare";
  if (current === "b_spare") return "b_safe";
  if (current === "b_safe") return resolveScreen(answers);

  if (current === "c_time") return "c_damage";
  if (current === "c_damage") return "c_air";
  if (current === "c_air") return "c_which";
  if (current === "c_which") return resolveScreen(answers);

  if (current === "d_how") return "d_air";
  if (current === "d_air") return "d_use";
  if (current === "d_use") return "d_need";
  if (current === "d_need") return resolveScreen(answers);

  if (current === "e_symptoms") return "e_last";
  if (current === "e_last") return "e_trigger";
  if (current === "e_trigger") return resolveScreen(answers);

  if (current === "f_which") return "f_supply";
  if (current === "f_supply") return "f_brand";
  if (current === "f_brand") return "f_balance";
  if (current === "f_balance") return resolveScreen(answers);

  if (current === "g_howmany") return "g_what";
  if (current === "g_what") return "g_spare";
  if (current === "g_spare") return "g_drive";
  if (current === "g_drive") return resolveScreen(answers);

  if (current === "h_describe") return "h_related";
  if (current === "h_related") {
    if (answerId === "power") return "h_power";
    if (answerId === "house") return "h_house";
    return resolveScreen(answers);
  }
  if (current === "h_power" || current === "h_house") {
    return resolveScreen(answers);
  }

  return "final";
}
