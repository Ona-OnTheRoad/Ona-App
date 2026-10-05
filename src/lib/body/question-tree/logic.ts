import { qaLinesForPath } from "@/lib/help-flow-progress";
import { BODY_FINAL_COPY, BODY_MIN_PHOTOS } from "./constants";
import { BODY_SCREENS } from "./screens";
import type { BodyRoute, BodyScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_serious",
  B: "b_count",
  C: "c_depth",
  D: "d_state",
  E: "e_part",
  F: "f_areas",
  G: "g_describe",
};

export function bodyScreen(id: string): BodyScreen | undefined {
  return BODY_SCREENS[id];
}

export function nextBodyScreen(
  current: string,
  answerId: string,
  _answers: Record<string, string>,
): string {
  if (current === "start") return START_NEXT[answerId] || "g_describe";

  if (current === "a_serious") return "a_parts";
  if (current === "a_parts") return "a_driveable";
  if (current === "a_driveable") return "a_insurance";
  if (current === "a_insurance") return "a_safe";
  if (current === "a_safe") return "final";

  if (current === "b_count") return "b_panels";
  if (current === "b_panels") return "b_depth";
  if (current === "b_depth") return "b_paint";
  if (current === "b_paint") return "b_repair";
  if (current === "b_repair") return "final";

  if (current === "c_depth") return "c_size";
  if (current === "c_size") return "c_respray";
  if (current === "c_respray") return "c_paint";
  if (current === "c_paint") return "final";

  if (current === "d_state") return "d_position";
  if (current === "d_position") return "d_mounts";
  if (current === "d_mounts") return "d_drive";
  if (current === "d_drive") return "final";

  if (current === "e_part") return "e_opens";
  if (current === "e_opens") return "e_alignment";
  if (current === "e_alignment") return "e_mechanical";
  if (current === "e_mechanical") return "final";

  if (current === "f_areas") return "f_quotation";
  if (current === "f_quotation") return "f_colour";
  if (current === "f_colour") return "f_driveable";
  if (current === "f_driveable") return "final";

  if (current === "g_describe") return "g_related";
  if (current === "g_related") return "final";

  return "final";
}

/**
 * Body is a capture-only cascade: no trade switching anywhere. The job
 * always dispatches as Body; the final tow question routes to Tow.
 */
export function resolveBodyRoute(_answers: Record<string, string>): BodyRoute {
  return { trade: "body", needsConfirm: false };
}

export function composeBodyProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines = qaLinesForPath({
    answers,
    next: nextBodyScreen,
    screenOf: bodyScreen,
  });

  if (landmark.trim()) {
    lines.push(BODY_FINAL_COPY.location);
    lines.push(landmark.trim());
  }
  if (extra.trim()) {
    lines.push(BODY_FINAL_COPY.extra);
    lines.push(extra.trim());
  }
  return lines.filter(Boolean).join("\n");
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length >= 2;
}

export function canFindBodyPro(photoCount: number): boolean {
  return photoCount >= BODY_MIN_PHOTOS;
}

export function bodyBreadcrumb(stack: string[]): string {
  const bits: string[] = ["Body"];
  if (stack.length > 1) {
    const firstBranch = stack[1];
    const letter = Object.entries(START_NEXT).find(
      ([, id]) => id === firstBranch,
    )?.[0];
    if (letter) bits.push(letter);
  }
  return bits.join(" · ");
}
