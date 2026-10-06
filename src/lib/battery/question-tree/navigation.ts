import { BATTERY_SCREENS } from "./screens";
import { resolveBatteryRoute } from "./route";
import type { BatteryScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_sudden",
  B: "b_click",
  C: "c_howlong",
  D: "d_often",
  E: "e_suspect",
  F: "f_sudden",
  G: "g_describe",
  H: "ev_type",
};

function resolveScreen(answers: Record<string, string>): "confirm" | "final" {
  return resolveBatteryRoute(answers).needsConfirm ? "confirm" : "final";
}

export function batteryScreen(id: string): BatteryScreen | undefined {
  return BATTERY_SCREENS[id];
}

export function nextBatteryScreen(
  current: string,
  answerId: string,
  answers: Record<string, string>,
): string {
  if (current === "start") return START_NEXT[answerId] || "g_describe";

  if (current === "a_sudden") return "a_lefton";
  if (current === "a_lefton") return "a_jump";
  if (current === "a_jump") return "a_terminals";
  if (current === "a_terminals") return "a_safe";
  if (current === "a_safe") return resolveScreen(answers);

  if (current === "b_click") return "b_bright";
  if (current === "b_bright") return "b_recent";
  if (current === "b_recent") return "b_safe";
  if (current === "b_safe") return resolveScreen(answers);

  if (current === "c_howlong") return "c_eventual";
  if (current === "c_eventual") return "c_idle";
  if (current === "c_idle") return "c_age";
  if (current === "c_age") return resolveScreen(answers);

  if (current === "d_often") return "d_lefton";
  if (current === "d_lefton") return "d_warning";
  if (current === "d_warning") return "d_altchecked";
  if (current === "d_altchecked") return resolveScreen(answers);

  if (current === "e_suspect") return "e_test_first";
  if (current === "e_test_first") return "e_brand";
  if (current === "e_brand") return resolveScreen(answers);

  if (current === "f_sudden") return "f_dim";
  if (current === "f_dim") return "f_stall";
  if (current === "f_stall") return "f_smell";
  if (current === "f_smell") return resolveScreen(answers);

  if (current === "g_describe") return "g_related";
  if (current === "g_related") {
    if (answerId === "power") return "g_power";
    if (answerId === "house") return "g_house";
    return resolveScreen(answers);
  }
  if (current === "g_power" || current === "g_house") {
    return resolveScreen(answers);
  }

  if (current === "ev_type") return "ev_safe";
  if (current === "ev_safe") return resolveScreen(answers);

  return "final";
}
