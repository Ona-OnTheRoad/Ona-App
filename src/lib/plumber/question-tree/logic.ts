import { PLUMBER_MIN_PHOTOS, PLUMBER_START_QUESTION } from "./constants";
import { PLUMBER_SCREENS } from "./screens";
import type { PlumberScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_flow",
  B: "b_source",
  C: "c_blocked",
  D: "d_what",
  E: "e_issue",
  F: "f_happening",
  G: "g_install",
  H: "h_describe",
};

export function plumberScreen(id: string): PlumberScreen | undefined {
  return PLUMBER_SCREENS[id];
}

/** Advance helper for the choice rows; returns the next screen id or "final". */
export function nextPlumberScreen(
  current: string,
  _answerId: string,
  _answers: Record<string, string>,
): string {
  const map: Record<string, string> = {
    a_flow: "a_area",
    a_area: "a_supply",
    a_supply: "a_tank",
    a_tank: "a_pump",
    a_pump: "a_tankwater",
    a_tankwater: "a_started",
    a_started: "final",

    b_source: "b_flow",
    b_flow: "b_shutoff",
    b_shutoff: "b_damage",
    b_damage: "b_exact",
    b_exact: "final",

    c_blocked: "c_backup",
    c_backup: "c_other",
    c_other: "c_tried",
    c_tried: "c_howlong",
    c_howlong: "final",

    d_what: "d_mount",
    d_mount: "d_water",
    d_water: "d_fix",
    d_fix: "final",

    e_issue: "e_type",
    e_type: "e_power",
    e_power: "e_age",
    e_age: "final",

    f_happening: "f_refill",
    f_refill: "f_cistern",
    f_cistern: "final",

    g_install: "g_scope",
    g_scope: "g_building",
    g_building: "g_materials",
    g_materials: "final",

    h_describe: "h_area",
    h_area: "h_when",
    h_when: "final",
  };
  if (current === "start") {
    return START_NEXT[_answerId] ?? "final";
  }
  return map[current] ?? "final";
}

/**
 * Strictly plumbing: the flow is capture-only and always dispatches as
 * "plumber" no confirm cards, no reroute to any other service.
 */
export function resolvePlumberRoute(_answers: Record<string, string>): {
  trade: "plumber";
  needsConfirm: false;
} {
  return { trade: "plumber", needsConfirm: false };
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length > 0;
}

export function canFindPlumberPro(photoCount: number): boolean {
  return photoCount >= PLUMBER_MIN_PHOTOS;
}

export function composePlumberProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines: string[] = [];
  const startLabel = answers.start_label || answers.start || "";
  lines.push(`Problem: ${startLabel} (${PLUMBER_START_QUESTION})`);
  const orderedIds = [
    "a_flow",
    "a_area",
    "a_supply",
    "a_tank",
    "a_pump",
    "a_tankwater",
    "a_started",
    "b_source",
    "b_flow",
    "b_shutoff",
    "b_damage",
    "b_exact",
    "c_blocked",
    "c_backup",
    "c_other",
    "c_tried",
    "c_howlong",
    "d_what",
    "d_mount",
    "d_water",
    "d_fix",
    "e_issue",
    "e_type",
    "e_power",
    "e_age",
    "f_happening",
    "f_refill",
    "f_cistern",
    "g_install",
    "g_scope",
    "g_building",
    "g_materials",
    "h_describe",
    "h_area",
    "h_when",
  ];
  for (const id of orderedIds) {
    const value = answers[`${id}_label`] || answers[id];
    if (!value) continue;
    const screen = PLUMBER_SCREENS[id];
    if (!screen) continue;
    lines.push(`${screen.question} ${value}`);
  }
  if (landmark.trim()) lines.push(`Location: ${landmark.trim()}`);
  if (extra.trim()) lines.push(`Extra: ${extra.trim()}`);
  return lines.join("\n");
}

export function plumberBreadcrumb(stack: string[]): string {
  const step = stack[stack.length - 1];
  if (!step || step === "start") return "Plumber";
  if (step === "final") return "Plumber · Send";
  return `Plumber · ${step.charAt(0).toUpperCase()}`;
}
