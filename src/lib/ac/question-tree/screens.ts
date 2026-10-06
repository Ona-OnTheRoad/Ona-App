import { AC_START_QUESTION, AC_UNIT_QUESTION } from "./constants";
import {
  AC_START_OPTIONS,
  AC_UNIT_OPTIONS,
  YES_NO,
  YES_NO_UNSURE,
} from "./options";
import type { AcScreen } from "./types";

export const AC_SCREENS: Record<string, AcScreen> = {
  unit: {
    id: "unit",
    question: AC_UNIT_QUESTION,
    kind: "choice",
    options: AC_UNIT_OPTIONS,
  },
  u_type: {
    id: "u_type",
    question: "What type of A/C unit is it?",
    kind: "text",
    placeholder: "e.g. window unit, split unit, central, mini-split…",
  },
  start: {
    id: "start",
    question: AC_START_QUESTION,
    kind: "choice",
    options: AC_START_OPTIONS,
  },
  a_fan: {
    id: "a_fan",
    question: "Does the A/C fan blow air (even if the air is not cold)?",
    kind: "choice",
    options: YES_NO,
  },
  a_click: {
    id: "a_click",
    question:
      "Do you hear the compressor click or engage when you switch A/C on?",
    kind: "choice",
    options: YES_NO_UNSURE,
  },
  a_last_service: {
    id: "a_last_service",
    question: "When was the last time the A/C gas was refilled or serviced?",
    kind: "choice",
    options: [
      { id: "within_6m", label: "Within the last 6 months" },
      { id: "within_year", label: "Within the last year" },
      { id: "over_year", label: "Over a year ago" },
      { id: "never", label: "Never" },
      { id: "unsure", label: "Don't know" },
    ],
  },
  a_recent_work: {
    id: "a_recent_work",
    question: "Any recent work done on the A/C or electrical system?",
    kind: "choice",
    options: YES_NO,
  },
  b_behavior: {
    id: "b_behavior",
    question:
      "Does it cool a little and then become warm, or is it always weak?",
    kind: "choice",
    options: [
      { id: "then_warm", label: "Cools a little, then becomes warm" },
      { id: "always_weak", label: "Always weak" },
    ],
  },
  b_idle: {
    id: "b_idle",
    question:
      "Is the problem worse when the vehicle is idling or when driving?",
    kind: "choice",
    options: [
      { id: "idling", label: "Worse when idling" },
      { id: "driving", label: "Worse when driving" },
      { id: "same", label: "Same both ways" },
    ],
  },
  b_sides: {
    id: "b_sides",
    question: "Are both driver and passenger sides affected equally?",
    kind: "choice",
    options: [
      { id: "equal", label: "Yes, both equal" },
      { id: "one_side", label: "No, one side is worse" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  b_noise: {
    id: "b_noise",
    question: "Any unusual noise or vibration when A/C is on?",
    kind: "choice",
    options: YES_NO,
  },
  c_sound: {
    id: "c_sound",
    question: "What does the noise sound like?",
    kind: "choice",
    options: [
      { id: "squealing", label: "Squealing / screeching" },
      { id: "rattling", label: "Rattling" },
      { id: "grinding", label: "Grinding" },
      { id: "clicking", label: "Clicking / knocking" },
      { id: "whining", label: "Whining" },
    ],
  },
  c_when: {
    id: "c_when",
    question:
      "Does the noise happen only when A/C is on, or also when it is off?",
    kind: "choice",
    options: [
      { id: "only_ac", label: "Only when A/C is on" },
      { id: "also_off", label: "Also when A/C is off" },
    ],
  },
  c_where: {
    id: "c_where",
    question:
      "Is the noise coming from the engine bay or from inside the dashboard?",
    kind: "choice",
    options: [
      { id: "engine_bay", label: "Engine bay" },
      { id: "dashboard", label: "Inside the dashboard" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  d_smell: {
    id: "d_smell",
    question: "What kind of smell is it?",
    kind: "choice",
    options: [
      { id: "musty", label: "Musty / mouldy" },
      { id: "burning", label: "Burning / electrical" },
      { id: "sweet", label: "Sweet / chemical" },
      { id: "other", label: "Other" },
    ],
  },
  d_when_smell: {
    id: "d_when_smell",
    question:
      "Does the smell appear only when A/C is on or also with normal fan?",
    kind: "choice",
    options: [
      { id: "only_ac", label: "Only when A/C is on" },
      { id: "also_fan", label: "Also with normal fan" },
    ],
  },
  d_damp: {
    id: "d_damp",
    question:
      "Has the vehicle been parked for a long time or in a damp environment?",
    kind: "choice",
    options: YES_NO,
  },
  e_stopped: {
    id: "e_stopped",
    question: "Did it stop producing cold air suddenly or gradually?",
    kind: "choice",
    options: [
      { id: "suddenly", label: "Suddenly" },
      { id: "gradually", label: "Gradually" },
    ],
  },
  e_warning: {
    id: "e_warning",
    question: "Any warning lights on the dashboard?",
    kind: "choice",
    options: YES_NO,
  },
  e_noise_smell: {
    id: "e_noise_smell",
    question:
      "Did you hear a loud noise or smell something just before it stopped?",
    kind: "choice",
    options: YES_NO,
  },
  e_fuse: {
    id: "e_fuse",
    question: "Have you checked the A/C fuse or relay (if known)?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes, checked" },
      { id: "no", label: "No, not checked" },
      { id: "unsure", label: "Not sure / don't know where" },
    ],
  },
  f_where: {
    id: "f_where",
    question: "Where is the water leaking from?",
    kind: "choice",
    options: [
      {
        id: "cabin",
        label: "Inside the cabin (passenger footwell, etc.)",
      },
      { id: "under", label: "Under the vehicle" },
      { id: "unit", label: "From the A/C unit itself (home/office)" },
    ],
  },
  f_running: {
    id: "f_running",
    question: "Does the leak happen only when A/C is running?",
    kind: "choice",
    options: YES_NO,
  },
  f_amount: {
    id: "f_amount",
    question: "Is the amount of water small or significant?",
    kind: "choice",
    options: [
      { id: "small", label: "Small" },
      { id: "significant", label: "Significant" },
    ],
  },
  g_describe: {
    id: "g_describe",
    question: "Please describe in your own words what is happening.",
    kind: "text",
    placeholder: "Please describe in your own words what is happening.",
  },
  g_related: {
    id: "g_related",
    question: "Is it related to:",
    kind: "choice",
    options: [
      { id: "engine", label: "Engine, starting or mechanical problem" },
      { id: "battery", label: "Battery or starting issue" },
      { id: "tyre", label: "Tyre or wheel problem" },
      { id: "body", label: "Body damage" },
      { id: "electrical", label: "Wiring or general electrical" },
      { id: "power", label: "Power generation at home/shop" },
      { id: "house", label: "House repair" },
      { id: "clothing", label: "Clothing" },
      { id: "ac", label: "Still A/C related" },
    ],
  },
};
