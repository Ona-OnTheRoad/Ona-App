import { PAINTER_SCREENS } from "./screens";
import type { PainterScreen } from "./types";

export const START_NEXT: Record<string, string> = {
  A: "a_scope",
  B: "b_place",
  C: "c_facility",
  D: "d_need",
  E: "e_need",
  F: "f_roof",
  G: "g_type",
  H: "h_need",
  I: "i_describe",
};

export function painterScreen(id: string): PainterScreen | undefined {
  return PAINTER_SCREENS[id];
}

/** Advance helper for the choice rows; returns the next screen id or "final". */
export function nextPainterScreen(
  current: string,
  _answerId: string,
  _answers: Record<string, string>,
): string {
  const map: Record<string, string> = {
    a_scope: "a_building",
    a_building: "a_size",
    a_size: "a_paint",
    a_paint: "a_supply",
    a_supply: "a_scaffold",
    a_scaffold: "final",

    b_place: "b_scope",
    b_scope: "b_front",
    b_front: "b_building",
    b_building: "b_supply",
    b_supply: "final",

    c_facility: "c_surface",
    c_surface: "c_req",
    c_req: "c_vacate",
    c_vacate: "final",

    d_need: "d_fresh",
    d_fresh: "d_sign",
    d_sign: "final",

    e_need: "e_material",
    e_material: "e_rust",
    e_rust: "e_colour",
    e_colour: "final",

    f_roof: "f_purpose",
    f_purpose: "f_paint",
    f_paint: "f_height",
    f_height: "final",

    g_type: "g_scope",
    g_scope: "g_size",
    g_size: "g_colour",
    g_colour: "g_supply",
    g_supply: "final",

    h_need: "h_design",
    h_design: "h_wall",
    h_wall: "final",

    i_describe: "i_location",
    i_location: "final",
  };
  if (current === "start") {
    return START_NEXT[_answerId] ?? "final";
  }
  return map[current] ?? "final";
}
