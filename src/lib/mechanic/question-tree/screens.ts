import type { MechanicScreen } from "./types";
import { MECHANIC_SCREENS_A } from "./screens-a";
import { MECHANIC_SCREENS_B } from "./screens-b";
import { MECHANIC_SCREENS_C } from "./screens-c";

export const MECHANIC_SCREENS: Record<string, MechanicScreen> = {
  ...MECHANIC_SCREENS_A,
  ...MECHANIC_SCREENS_B,
  ...MECHANIC_SCREENS_C,
};
