import type { CarpenterScreen } from "./types";
import { CARPENTER_SCREENS_A } from "./screens-a";
import { CARPENTER_SCREENS_B } from "./screens-b";

export const CARPENTER_SCREENS: Record<string, CarpenterScreen> = {
  ...CARPENTER_SCREENS_A,
  ...CARPENTER_SCREENS_B,
};
