import type { PainterScreen } from "./types";
import { PAINTER_SCREENS_A } from "./screens-a";
import { PAINTER_SCREENS_B } from "./screens-b";

export const PAINTER_SCREENS: Record<string, PainterScreen> = {
  ...PAINTER_SCREENS_A,
  ...PAINTER_SCREENS_B,
};
