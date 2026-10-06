import type { VulcanizerScreen } from "./types";
import {
  VULCANIZER_START_QUESTION,
  VULCANIZER_START_OPTIONS,
  YES_NO,
  TYRE_POSITIONS,
} from "./constants";

export const VULCANIZER_SCREENS_A: Record<string, VulcanizerScreen> = {
  start: {
    id: "start",
    question: VULCANIZER_START_QUESTION,
    kind: "choice",
    options: VULCANIZER_START_OPTIONS,
  },
  // Branch A flat tyre / puncture
  a_which: {
    id: "a_which",
    question: "Which tyre(s) is affected?",
    kind: "choice",
    options: [...TYRE_POSITIONS, { id: "more", label: "More than one" }],
  },
  a_object: {
    id: "a_object",
    question: "Is the object (nail, screw, etc.) still visible in the tyre?",
    kind: "choice",
    options: YES_NO,
  },
  a_spare: {
    id: "a_spare",
    question: "Do you have a good spare tyre?",
    kind: "choice",
    options: YES_NO,
  },
  a_jack: {
    id: "a_jack",
    question: "Do you have a jack and wheel spanner with you?",
    kind: "choice",
    options: YES_NO,
  },
  a_safe: {
    id: "a_safe",
    question:
      "Is the vehicle currently in a safe location or still on the road/highway?",
    kind: "choice",
    options: [
      { id: "safe", label: "Safe location" },
      { id: "road", label: "On the road / highway" },
    ],
  },
  // Branch B burst or blown tyre
  b_which: {
    id: "b_which",
    question: "Which tyre burst?",
    kind: "choice",
    options: TYRE_POSITIONS,
  },
  b_pull: {
    id: "b_pull",
    question: "Did the vehicle pull strongly to one side when it happened?",
    kind: "choice",
    options: YES_NO,
  },
  b_rim: {
    id: "b_rim",
    question: "Is the rim damaged?",
    kind: "choice",
    options: YES_NO,
  },
  b_spare: {
    id: "b_spare",
    question: "Do you have a good spare?",
    kind: "choice",
    options: YES_NO,
  },
  b_safe: {
    id: "b_safe",
    question: "Is the vehicle safe to stay where it is?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch C slow puncture
  c_time: {
    id: "c_time",
    question: "How long has the tyre been losing air?",
    kind: "choice",
    options: [
      { id: "hours", label: "A few hours" },
      { id: "days", label: "A few days" },
      { id: "week", label: "A week or more" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  c_damage: {
    id: "c_damage",
    question: "Do you see any nail, screw or damage on the tread or sidewall?",
    kind: "choice",
    options: [
      { id: "tread", label: "Yes nail / screw on the tread" },
      { id: "sidewall", label: "Yes damage on the sidewall" },
      { id: "none", label: "Nothing visible" },
    ],
  },
  c_air: {
    id: "c_air",
    question: "Have you added air more than once already?",
    kind: "choice",
    options: YES_NO,
  },
  c_which: {
    id: "c_which",
    question: "Which tyre is affected?",
    kind: "choice",
    options: TYRE_POSITIONS,
  },
  // Branch D damaged rim / wheel
  d_how: {
    id: "d_how",
    question: "How did the rim get damaged?",
    kind: "choice",
    options: [
      { id: "pothole", label: "Pothole" },
      { id: "accident", label: "Accident / collision" },
      { id: "impact", label: "Impact with a curb or object" },
      { id: "rust", label: "Rust / wear" },
      { id: "other", label: "Other / not sure" },
    ],
  },
  d_air: {
    id: "d_air",
    question: "Is the tyre still holding air?",
    kind: "choice",
    options: YES_NO,
  },
  d_use: {
    id: "d_use",
    question: "Is the wheel still usable or is it unsafe to drive?",
    kind: "choice",
    options: [
      { id: "usable", label: "Still usable" },
      { id: "unsafe", label: "Unsafe to drive" },
    ],
  },
  d_need: {
    id: "d_need",
    question: "Do you need only rim repair or full wheel replacement?",
    kind: "choice",
    options: [
      { id: "repair", label: "Rim repair" },
      { id: "replace", label: "Full wheel replacement" },
    ],
  },
  // Branch E balancing / alignment
};
