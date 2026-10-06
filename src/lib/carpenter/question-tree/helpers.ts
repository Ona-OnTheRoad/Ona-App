import { CARPENTER_START_QUESTION, CARPENTER_MIN_PHOTOS } from "./constants";
import { CARPENTER_SCREENS } from "./screens";

/**
 * Strictly furniture making & carpentry: the flow is capture-only and always
 * dispatches as "carpenter" no confirm cards, no reroute to any other service.
 */
export function resolveCarpenterRoute(_answers: Record<string, string>): {
  trade: "carpenter";
  needsConfirm: false;
} {
  return { trade: "carpenter", needsConfirm: false };
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length > 0;
}

export function canFindCarpenterPro(photoCount: number): boolean {
  return photoCount >= CARPENTER_MIN_PHOTOS;
}

export function composeCarpenterJob(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines: string[] = [];
  const startLabel = answers.start_label || answers.start || "";
  lines.push(`Work needed: ${startLabel} (${CARPENTER_START_QUESTION})`);
  const orderedIds = [
    "a_type",
    "a_wood",
    "a_woodtype",
    "a_design",
    "a_measure",
    "b_problem",
    "b_type",
    "b_parts",
    "b_where",
    "c_need",
    "c_building",
    "c_wood",
    "c_install",
    "d_work",
    "d_building",
    "d_sheet",
    "d_scaffold",
    "e_need",
    "e_space",
    "e_design",
    "e_material",
    "f_place",
    "f_items",
    "f_setup",
    "g_need",
    "g_duration",
    "g_mobile",
    "h_describe",
    "h_location",
    "h_wood",
    "i_explain",
    "i_location",
  ];
  for (const id of orderedIds) {
    const value = answers[`${id}_label`] || answers[id];
    if (!value) continue;
    const screen = CARPENTER_SCREENS[id];
    if (!screen) continue;
    lines.push(`${screen.question} ${value}`);
  }
  if (landmark.trim()) lines.push(`Location: ${landmark.trim()}`);
  if (extra.trim()) lines.push(`Extra: ${extra.trim()}`);
  return lines.join("\n");
}

export function carpenterBreadcrumb(stack: string[]): string {
  const step = stack[stack.length - 1];
  if (!step || step === "start") return "Carpenter";
  if (step === "final") return "Carpenter · Send";
  return `Carpenter · ${step.charAt(0).toUpperCase()}`;
}
