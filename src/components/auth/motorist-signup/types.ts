/** 1 details · 2 password · 3 area · 4 vehicles (progress bars start at step 2). */
export type Step = 1 | 2 | 3 | 4;

export const STEP_TITLES: Record<Step, string> = {
  1: "Create account",
  2: "Set your password",
  3: "Where are you based?",
  4: "Your vehicles",
};

export const STEP_SUBTITLES: Record<Step, string> = {
  1: "Create your account to get started with Ona.",
  2: "Set up your password to secure your account.",
  3: "City and area where you usually need help.",
  4: "Optional. Skip if you do not need vehicle services.",
};
