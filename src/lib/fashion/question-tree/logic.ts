import { qaLinesForPath } from "@/lib/help-flow-progress";
import { FASHION_FINAL_COPY, FASHION_MIN_PHOTOS } from "./constants";
import { FASHION_SCREENS } from "./screens";
import type { FashionRoute, FashionScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_who",
  B: "b_count",
  C: "c_what",
  D: "d_damage",
  E: "e_looking",
  F: "f_advice",
  G: "g_describe",
};

export function fashionScreen(id: string): FashionScreen | undefined {
  return FASHION_SCREENS[id];
}

export function nextFashionScreen(
  current: string,
  _answerId: string,
  _answers: Record<string, string>,
): string {
  if (current === "start") return START_NEXT[_answerId] || "g_describe";

  if (current === "a_who") return "a_style";
  if (current === "a_style") return "a_fabric";
  if (current === "a_fabric") return "a_style_ref";
  if (current === "a_style_ref") return "a_ready";
  if (current === "a_ready") return "final";

  if (current === "b_count") return "b_group";
  if (current === "b_group") return "b_fabric";
  if (current === "b_fabric") return "b_have";
  if (current === "b_have") return "b_same";
  if (current === "b_same") return "b_date";
  if (current === "b_date") return "final";

  if (current === "c_what") return "c_native";
  if (current === "c_native") return "c_have";
  if (current === "c_have") return "final";

  if (current === "d_damage") return "d_value";
  if (current === "d_value") return "d_repair";
  if (current === "d_repair") return "final";

  if (current === "e_looking") return "e_fitting";
  if (current === "e_fitting") return "final";

  if (current === "f_advice") return "f_budget";
  if (current === "f_budget") return "final";

  if (current === "g_describe") return "g_related";
  if (current === "g_related") return "final";

  return "final";
}

/**
 * Fashion is a capture-only cascade: every branch stays with Fashion and the
 * Branch G hints (Mechanic / Carpenter / Generator etc.) are kept as notes,
 * never a trade switch.
 */
export function resolveFashionRoute(
  _answers: Record<string, string>,
): FashionRoute {
  return { trade: "fashion", needsConfirm: false };
}

export function composeFashionProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines = qaLinesForPath({
    answers,
    next: nextFashionScreen,
    screenOf: fashionScreen,
  });

  if (landmark.trim()) {
    lines.push(FASHION_FINAL_COPY.location);
    lines.push(landmark.trim());
  }
  if (extra.trim()) {
    lines.push(FASHION_FINAL_COPY.extra);
    lines.push(extra.trim());
  }
  return lines.filter(Boolean).join("\n");
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length >= 2;
}

export function canFindFashionPro(photoCount: number): boolean {
  return photoCount >= FASHION_MIN_PHOTOS;
}

export function fashionBreadcrumb(stack: string[]): string {
  const bits: string[] = ["Fashion"];
  const firstBranch = stack.find((id) => id !== "start" && id !== "final");
  if (firstBranch) {
    const letter = Object.entries(START_NEXT).find(
      ([, id]) => id === firstBranch,
    )?.[0];
    if (letter) bits.push(letter);
  }
  if (stack[stack.length - 1] === "final") bits.push("Send");
  return bits.join(" · ");
}
