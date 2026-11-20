import type { ProService } from "@/lib/types";
import { knownGeneratorFuel } from "@/lib/generator/catalog";
import {
  GEN_MACHINE_QUESTION,
  GEN_MIN_PHOTOS,
  GEN_START_QUESTION,
} from "./constants";
import { GEN_SCREENS } from "./screens";
import type { GenRoute, GenScreen } from "./types";

export function nextGeneratorScreen(
  step: string,
  _answer: string,
  _answers: Record<string, string>,
): string {
  switch (step) {
    case "machine":
      return "start";
    case "start":
      return _answer === "A"
        ? "a_property"
        : _answer === "B"
          ? "b_start"
          : _answer === "C"
            ? "c_output"
            : _answer === "D"
              ? "d_service"
              : _answer === "E"
                ? "e_issue"
                : _answer === "F"
                  ? "f_happening"
                  : "g_describe";
    case "a_property":
      return "a_power";
    case "a_power":
      return "a_hours";
    case "a_hours":
      return "a_type";
    case "a_type":
      return "a_size";
    case "a_size":
      return "a_noise";
    case "a_noise":
      return "a_supply";
    case "a_supply":
      return "a_changeover";
    case "a_changeover":
      return "final";

    case "b_start":
      return "b_method";
    case "b_method":
      return "b_signs";
    case "b_signs":
      return knownGeneratorFuel(_answers) ? "b_service" : "b_type";
    case "b_type":
      return "b_service";
    case "b_service":
      return "b_fuel";
    case "b_fuel":
      return "b_work";
    case "b_work":
      return "confirm";

    case "c_output":
      return "c_breaker";
    case "c_breaker":
      return "c_voltage";
    case "c_voltage":
      return "c_load";
    case "c_load":
      return "c_changeover";
    case "c_changeover":
      return "confirm";

    case "d_service":
      return "d_last";
    case "d_last":
      return knownGeneratorFuel(_answers) ? "d_usage" : "d_spec";
    case "d_spec":
      return "d_usage";
    case "d_usage":
      return "d_problem";
    case "d_problem":
      return "final";

    case "e_issue":
      return "e_kind";
    case "e_kind":
      return "e_phase";
    case "e_phase":
      return "e_symptom";
    case "e_symptom":
      return "e_history";
    case "e_history":
      return "confirm";

    case "f_happening":
      return "f_when";
    case "f_when":
      return "f_oil";
    case "f_oil":
      return "f_also";
    case "f_also":
      return "final";

    case "g_describe":
      return "g_when";
    case "g_when":
      return "g_location";
    case "g_location":
      return "confirm";

    default:
      return "final";
  }
}

export function genScreen(id: string): GenScreen | undefined {
  return GEN_SCREENS[id];
}

export function canFindGeneratorPro(photoCount: number): boolean {
  return photoCount >= GEN_MIN_PHOTOS;
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length > 0;
}

export function resolveGeneratorRoute(
  answers: Record<string, string>,
): GenRoute {
  const start = answers.start || "";
  const needsConfirm = ["B", "C", "E", "G"].includes(start);
  return needsConfirm
    ? { trade: "electrical", alternate: "generator", needsConfirm: true }
    : { trade: "generator", alternate: "generator", needsConfirm: false };
}

export function applyConfirmChoice(
  route: GenRoute,
  chooseAlternate: boolean,
): ProService {
  return chooseAlternate ? route.trade : route.alternate;
}

export function confirmQuestion(trade: ProService): string {
  const name =
    trade === "electrical"
      ? "Electrical"
      : trade.charAt(0).toUpperCase() + trade.slice(1);
  return `This sounds like ${name}. Continue?`;
}

export function composeGeneratorProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines: string[] = [];
  const machineLabel = answers.machine_label || answers.machine || "";
  if (machineLabel) {
    lines.push(`${GEN_MACHINE_QUESTION} ${machineLabel}`);
  }
  const startLabel = answers.start_label || answers.start || "";
  lines.push(`Generator work: ${startLabel} (${GEN_START_QUESTION})`);
  const orderedIds = [
    "a_property",
    "a_power",
    "a_hours",
    "a_type",
    "a_size",
    "a_noise",
    "a_supply",
    "a_changeover",
    "b_start",
    "b_method",
    "b_signs",
    "b_type",
    "b_service",
    "b_fuel",
    "b_work",
    "c_output",
    "c_breaker",
    "c_voltage",
    "c_load",
    "c_changeover",
    "d_service",
    "d_last",
    "d_spec",
    "d_usage",
    "d_problem",
    "e_issue",
    "e_kind",
    "e_phase",
    "e_symptom",
    "e_history",
    "f_happening",
    "f_when",
    "f_oil",
    "f_also",
    "g_describe",
    "g_when",
    "g_location",
  ];
  for (const id of orderedIds) {
    const value = answers[`${id}_label`] || answers[id];
    if (!value) continue;
    const screen = GEN_SCREENS[id];
    if (!screen) continue;
    lines.push(`${screen.question} ${value}`);
  }
  if (landmark.trim()) lines.push(`Location / landmark: ${landmark.trim()}`);
  if (extra.trim()) lines.push(`Extra detail: ${extra.trim()}`);
  return lines.join("\n");
}

export function generatorBreadcrumb(stack: string[]): string {
  const workIdx = stack[0] === "machine" ? 1 : 0;
  const start = stack[workIdx] === "start" ? stack[workIdx + 1] || "" : "";
  const letter =
    start === "a_property"
      ? "A"
      : start === "b_start"
        ? "B"
        : start === "c_output"
          ? "C"
          : start === "d_service"
            ? "D"
            : start === "e_issue"
              ? "E"
              : start === "f_happening"
                ? "F"
                : start === "g_describe"
                  ? "G"
                  : "";
  const last = stack[stack.length - 1];
  if (last === "final")
    return letter ? `Generator · ${letter} · Send` : "Generator · Send";
  return letter ? `Generator · ${letter}` : "Generator";
}
