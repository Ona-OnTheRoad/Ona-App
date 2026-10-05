export type Step = 1 | 2 | 3;

export const STEP_TITLES: Record<Step, string> = {
  1: "Your account",
  2: "Service area",
  3: "Your vehicles",
};

export const STEP_SUBTITLES: Record<Step, string> = {
  1: "Create your car owner profile so you can ask for help nearby",
  2: "City and area where you usually need help",
  3: "Optional skip if you do not need vehicle services",
};
