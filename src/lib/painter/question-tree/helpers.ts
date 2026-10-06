import { PAINTER_START_QUESTION, PAINTER_MIN_PHOTOS } from "./constants";
import { PAINTER_SCREENS } from "./screens";

/**
 * Strictly painting works: the flow is capture-only and always dispatches as
 * "painter" no confirm cards, no reroute to any other service.
 */
export function resolvePainterRoute(_answers: Record<string, string>): {
  trade: "painter";
  needsConfirm: false;
} {
  return { trade: "painter", needsConfirm: false };
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length > 0;
}

export function canFindPainterPro(photoCount: number): boolean {
  return photoCount >= PAINTER_MIN_PHOTOS;
}

export function composePainterJob(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines: string[] = [];
  const startLabel = answers.start_label || answers.start || "";
  lines.push(`Painting work: ${startLabel} (${PAINTER_START_QUESTION})`);
  const orderedIds = [
    "a_scope",
    "a_building",
    "a_size",
    "a_paint",
    "a_supply",
    "a_scaffold",
    "b_place",
    "b_scope",
    "b_front",
    "b_building",
    "b_supply",
    "c_facility",
    "c_surface",
    "c_req",
    "c_vacate",
    "d_need",
    "d_fresh",
    "d_sign",
    "e_need",
    "e_material",
    "e_rust",
    "e_colour",
    "f_roof",
    "f_purpose",
    "f_paint",
    "f_height",
    "g_type",
    "g_scope",
    "g_size",
    "g_colour",
    "g_supply",
    "h_need",
    "h_design",
    "h_wall",
    "i_describe",
    "i_location",
  ];
  for (const id of orderedIds) {
    const value = answers[`${id}_label`] || answers[id];
    if (!value) continue;
    const screen = PAINTER_SCREENS[id];
    if (!screen) continue;
    lines.push(`${screen.question} ${value}`);
  }
  if (landmark.trim()) lines.push(`Location: ${landmark.trim()}`);
  if (extra.trim()) lines.push(`Extra: ${extra.trim()}`);
  return lines.join("\n");
}

export function painterBreadcrumb(stack: string[]): string {
  const step = stack[stack.length - 1];
  if (!step || step === "start") return "Painter";
  if (step === "final") return "Painter · Send";
  return `Painter · ${step.charAt(0).toUpperCase()}`;
}
