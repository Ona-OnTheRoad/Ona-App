/** 1 password · 2 area · 3 vehicles (details are collected earlier at /signup). */
export type Step = 1 | 2 | 3;

export const STEP_TITLES: Record<Step, string> = {
  1: "Set your password",
  2: "Where are you based?",
  3: "Your vehicles",
};

export const STEP_SUBTITLES: Record<Step, string> = {
  1: "Set up your password to secure your account.",
  2: "We use your location to calculate accurate arrival times and dispatch nearby pros.",
  3: "This helps your professional arrive with the right tools and parts.",
};
