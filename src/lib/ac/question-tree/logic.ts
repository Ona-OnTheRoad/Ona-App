import { qaLinesForPath } from "@/lib/help-flow-progress";
import { AC_FINAL_COPY, AC_MIN_PHOTOS } from "./constants";
import { AC_SCREENS } from "./screens";
import type { AcRoute, AcScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_fan",
  B: "b_behavior",
  C: "c_sound",
  D: "d_smell",
  E: "e_stopped",
  F: "f_where",
  G: "g_describe",
};

export function acScreen(id: string): AcScreen | undefined {
  return AC_SCREENS[id];
}

export function nextAcScreen(
  current: string,
  answerId: string,
  _answers: Record<string, string>,
): string {
  if (current === "unit") return answerId === "vehicle" ? "vehicle" : "u_type";
  if (current === "u_type") return "start";
  if (current === "start") return START_NEXT[answerId] || "g_describe";

  if (current === "a_fan") return "a_click";
  if (current === "a_click") return "a_last_service";
  if (current === "a_last_service") return "a_recent_work";
  if (current === "a_recent_work") return "final";

  if (current === "b_behavior") return "b_idle";
  if (current === "b_idle") return "b_sides";
  if (current === "b_sides") return "b_noise";
  if (current === "b_noise") return "final";

  if (current === "c_sound") return "c_when";
  if (current === "c_when") return "c_where";
  if (current === "c_where") return "final";

  if (current === "d_smell") return "d_when_smell";
  if (current === "d_when_smell") return "d_damp";
  if (current === "d_damp") return "final";

  if (current === "e_stopped") return "e_warning";
  if (current === "e_warning") return "e_noise_smell";
  if (current === "e_noise_smell") return "e_fuse";
  if (current === "e_fuse") return "final";

  if (current === "f_where") return "f_running";
  if (current === "f_running") return "f_amount";
  if (current === "f_amount") return "final";

  if (current === "g_describe") return "g_related";
  if (current === "g_related") return "final";

  return "final";
}

/**
 * A/C is a single-trade flow: no trade switching and no Tow anywhere.
 * Every path resolves to A/C without a confirm card.
 */
export function resolveAcRoute(_answers: Record<string, string>): AcRoute {
  return { trade: "ac", needsConfirm: false };
}

export function composeAcProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines = qaLinesForPath({
    answers,
    next: nextAcScreen,
    screenOf: acScreen,
    startId: answers.unit ? "unit" : "start",
    bridge: { vehicle: "start" },
  });

  if (landmark.trim()) {
    lines.push(AC_FINAL_COPY.location);
    lines.push(landmark.trim());
  }
  if (extra.trim()) {
    lines.push(AC_FINAL_COPY.extra);
    lines.push(extra.trim());
  }
  return lines.filter(Boolean).join("\n");
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length >= 2;
}

export function canFindAcPro(photoCount: number): boolean {
  return photoCount >= AC_MIN_PHOTOS;
}

export function acBreadcrumb(stack: string[]): string {
  const bits: string[] = ["A/C"];
  if (stack.length > 1) {
    const firstBranch = stack[1];
    const letter = Object.entries(START_NEXT).find(
      ([, id]) => id === firstBranch,
    )?.[0];
    if (letter) bits.push(letter);
  }
  if (stack[stack.length - 1] === "final") bits.push("Send");
  return bits.join(" · ");
}
