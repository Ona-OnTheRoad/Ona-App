import type { VulcanizerScreen } from "./types";
import { VULCANIZER_SCREENS_A } from "./screens-a";
import { VULCANIZER_SCREENS_B } from "./screens-b";

export const VULCANIZER_SCREENS: Record<string, VulcanizerScreen> = {
  ...VULCANIZER_SCREENS_A,
  ...VULCANIZER_SCREENS_B,
};
