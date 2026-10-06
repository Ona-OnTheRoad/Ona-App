import { MECHANIC_SCREENS } from "./screens";
import {
  MECHANIC_PART_IDS,
  MECHANIC_PART_LABELS,
  PART_CHAIN,
  PART_FIRST,
  START_NEXT,
  type MechanicPartId,
} from "./parts";
import { rankMechanicParts } from "./scoring";
import { resolveMechanicRoute } from "./route";
import type { MechanicScreen } from "./types";

function shouldSkipPartCascade(answers: Record<string, string>): boolean {
  const main = answers.start;
  if (main === "H") return true;
  if (main === "I" && answers.l_related && answers.l_related !== "vehicle") {
    return true;
  }
  if (answers.g_type === "electric" || answers.g_ev) return true;
  if (resolveMechanicRoute(answers).trade === "towing") return true;
  return false;
}

function nextAfterSymptoms(answers: Record<string, string>): string {
  if (shouldSkipPartCascade(answers)) return resolveScreen(answers);
  const ranked = rankMechanicParts(answers);
  if (ranked.length === 0) return resolveScreen(answers);
  if (ranked.length === 1) return PART_FIRST[ranked[0]];
  return "part_pick";
}

function resolveScreen(answers: Record<string, string>): "confirm" | "final" {
  return resolveMechanicRoute(answers).needsConfirm ? "confirm" : "final";
}

export function mechanicScreen(
  id: string,
  answers: Record<string, string> = {},
): MechanicScreen | undefined {
  const screen = MECHANIC_SCREENS[id];
  if (!screen) return undefined;
  if (id !== "part_pick") return screen;
  const ranked = rankMechanicParts(answers);
  const ids = ranked.length >= 2 ? ranked : MECHANIC_PART_IDS.slice();
  return {
    ...screen,
    options: [
      ...ids.map((partId) => ({
        id: partId,
        label: MECHANIC_PART_LABELS[partId],
      })),
      // Customers often cannot name vehicle parts give them an honest out.
      { id: "not_sure", label: "I'm not sure" },
    ],
  };
}

export function nextMechanicScreen(
  current: string,
  answerId: string,
  answers: Record<string, string>,
): string {
  if (current === "start") {
    if (answers.powertrain === "Electric" && answerId === "G") {
      return "g_ev";
    }
    return START_NEXT[answerId] || "l_describe";
  }

  if (current === "a_what") return "a_lights";
  if (current === "a_lights") return "a_when";
  if (current === "a_when") return "a_recent";
  if (current === "a_recent") return "a_danger";
  if (current === "a_danger") return nextAfterSymptoms(answers);

  if (current === "b_how") return "b_warning";
  if (current === "b_warning") return "b_restart";
  if (current === "b_restart") return "b_load";
  if (current === "b_load") return "b_move";
  if (current === "b_move") return nextAfterSymptoms(answers);

  if (current === "c_where") return "c_when";
  if (current === "c_when") return "c_sound";
  if (current === "c_sound") return "c_safe";
  if (current === "c_safe") return nextAfterSymptoms(answers);

  if (current === "d_red") return "d_steam";
  if (current === "d_steam") return "d_fan";
  if (current === "d_fan") return "d_when";
  if (current === "d_when") return "d_ac";
  if (current === "d_ac") return "d_safe";
  if (current === "d_safe") return nextAfterSymptoms(answers);

  if (current === "e_color") return "e_where";
  if (current === "e_where") return nextAfterSymptoms(answers);

  if (current === "f_color") return "f_where";
  if (current === "f_where") return "f_safe";
  if (current === "f_safe") return nextAfterSymptoms(answers);

  if (current === "g_type") {
    if (answerId === "electric") return "g_ev";
    return "g_what";
  }
  if (current === "g_what") return nextAfterSymptoms(answers);
  if (current === "g_ev") return resolveScreen(answers);

  if (current === "part_pick") {
    // "I'm not sure" skips the part cascade the symptom answers already
    // ranked things, so the confirm/final screen still carries a diagnosis.
    if (answerId === "not_sure") return resolveScreen(answers);
    const part = answerId as MechanicPartId;
    return PART_FIRST[part] || resolveScreen(answers);
  }
  const partNext = PART_CHAIN[current];
  if (partNext === "end") return resolveScreen(answers);
  if (partNext) return partNext;

  if (current === "h_light") return "h_parts";
  if (current === "h_parts") return resolveScreen(answers);

  if (current === "i_accident") return "i_parts";
  if (current === "i_parts") return "i_driveable";
  if (current === "i_driveable") return "i_paint";
  if (current === "i_paint") return resolveScreen(answers);

  if (current === "j_kind") return "j_which";
  if (current === "j_which") return "j_spare";
  if (current === "j_spare") return "j_multi";
  if (current === "j_multi") return resolveScreen(answers);

  if (current === "k_vehicle") return "k_issue";
  if (current === "k_issue") return resolveScreen(answers);

  if (current === "l_describe") return "l_related";
  if (current === "l_related") {
    if (answerId === "power") return "l_power";
    if (answerId === "house") return "l_house";
    return nextAfterSymptoms(answers);
  }
  if (current === "l_power" || current === "l_house") {
    return resolveScreen(answers);
  }

  if (current === "ev_issue") {
    if (answerId === "other") return "ev_other";
    return resolveScreen(answers);
  }
  if (current === "ev_other") return resolveScreen(answers);

  return "final";
}
