import { qaLinesForPath } from "@/lib/help-flow-progress";
import { ELECTRICAL_FINAL_COPY, ELECTRICAL_MIN_PHOTOS } from "./constants";
import { ELECTRICAL_SCREENS } from "./screens";
import type { ElectricalRoute, ElectricalScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "vehicle",
  B: "b_main",
  C: "c_main",
  D: "d_main",
  E: "e_describe",
};

export function electricalScreen(id: string): ElectricalScreen | undefined {
  return ELECTRICAL_SCREENS[id];
}

export function nextElectricalScreen(
  current: string,
  answerId: string,
  _answers: Record<string, string>,
): string {
  if (current === "start") return START_NEXT[answerId] || "e_describe";

  if (current === "a_symptom") return "a_after";
  if (current === "a_after") return "a_smell";
  if (current === "a_smell") return "a_start";
  if (current === "a_start") return "a_safe";
  if (current === "a_safe") return "final";

  if (current === "b_main") return "b_board";
  if (current === "b_board") return "b_after";
  if (current === "b_after") return "b_smell";
  if (current === "b_smell") return "b_emergency";
  if (current === "b_emergency") return "final";

  if (current === "c_main") return "c_scope";
  if (current === "c_scope") return "c_three";
  if (current === "c_three") return "c_critical";
  if (current === "c_critical") return "c_emergency";
  if (current === "c_emergency") return "final";

  if (current === "d_main") return "d_facility";
  if (current === "d_facility") return "d_warranty";
  if (current === "d_warranty") return "d_production";
  if (current === "d_production") return "d_safety";
  if (current === "d_safety") return "final";

  if (current === "e_describe") return "e_related";
  if (current === "e_related") return "final";

  return "final";
}

/**
 * Electric is a capture-only cascade: no trade switching anywhere. The job
 * always dispatches as Electric; the final tow question (vehicle branch
 * only) routes to Tow.
 */
export function resolveElectricalRoute(
  _answers: Record<string, string>,
): ElectricalRoute {
  return { trade: "electrical", needsConfirm: false };
}

export function composeElectricalProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines = qaLinesForPath({
    answers,
    next: nextElectricalScreen,
    screenOf: electricalScreen,
    bridge: { vehicle: "a_symptom" },
  });

  if (landmark.trim()) {
    lines.push(ELECTRICAL_FINAL_COPY.location);
    lines.push(landmark.trim());
  }
  if (extra.trim()) {
    lines.push(ELECTRICAL_FINAL_COPY.extra);
    lines.push(extra.trim());
  }
  return lines.filter(Boolean).join("\n");
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length >= 2;
}

export function canFindElectricalPro(photoCount: number): boolean {
  return photoCount >= ELECTRICAL_MIN_PHOTOS;
}

export function electricalBreadcrumb(stack: string[]): string {
  const bits: string[] = ["Electric"];
  if (stack.length > 1) {
    const firstBranch = stack[1];
    const letter = Object.entries(START_NEXT).find(
      ([, id]) => id === firstBranch,
    )?.[0];
    if (letter) bits.push(letter);
  }
  return bits.join(" · ");
}
