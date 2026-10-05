import { CARPENTER_SCREENS } from "./screens";
import type { CarpenterScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_type",
  B: "b_problem",
  C: "c_need",
  D: "d_work",
  E: "e_need",
  F: "f_place",
  G: "g_need",
  H: "h_describe",
  I: "i_explain",
};

export function carpenterScreen(id: string): CarpenterScreen | undefined {
  return CARPENTER_SCREENS[id];
}

/** Advance helper for the choice rows; returns the next screen id or "final". */
export function nextCarpenterScreen(
  current: string,
  _answerId: string,
  _answers: Record<string, string>,
): string {
  const map: Record<string, string> = {
    a_type: "a_wood",
    a_wood: "a_woodtype",
    a_woodtype: "a_design",
    a_design: "a_measure",
    a_measure: "final",

    b_problem: "b_type",
    b_type: "b_parts",
    b_parts: "b_where",
    b_where: "final",

    c_need: "c_building",
    c_building: "c_wood",
    c_wood: "c_install",
    c_install: "final",

    d_work: "d_building",
    d_building: "d_sheet",
    d_sheet: "d_scaffold",
    d_scaffold: "final",

    e_need: "e_space",
    e_space: "e_design",
    e_design: "e_material",
    e_material: "final",

    f_place: "f_items",
    f_items: "f_setup",
    f_setup: "final",

    g_need: "g_duration",
    g_duration: "g_mobile",
    g_mobile: "final",

    h_describe: "h_location",
    h_location: "h_wood",
    h_wood: "final",

    i_explain: "i_location",
    i_location: "final",
  };
  if (current === "start") {
    return START_NEXT[_answerId] ?? "final";
  }
  return map[current] ?? "final";
}
