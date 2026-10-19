/** 1 password · 2 area · 3 vehicles (details are collected earlier at /signup). */
export type Step = 1 | 2 | 3;

export const STEP_TITLES: Record<Step, string> = {
  1: "Set your password",
  2: "Where are you based?",
  3: "Your vehicles",
};

export const STEP_SUBTITLES: Record<Step, string> = {
  1: "Set up your password to secure your account.",
  2: "City and area where you usually need help.",
  3: "Optional. Skip if you do not need vehicle services.",
};
