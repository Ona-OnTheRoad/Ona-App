import type { BatteryScreen } from "./types";
import {
  BATTERY_START_QUESTION,
  BATTERY_START_OPTIONS,
  YES_NO,
  YES_NO_UNSURE,
} from "./constants";

export const BATTERY_SCREENS: Record<string, BatteryScreen> = {
  start: {
    id: "start",
    question: BATTERY_START_QUESTION,
    kind: "choice",
    options: BATTERY_START_OPTIONS,
  },
  a_sudden: {
    id: "a_sudden",
    question:
      "Did this happen suddenly or after the vehicle was parked for a long time?",
    kind: "choice",
    options: [
      { id: "suddenly", label: "Suddenly" },
      {
        id: "parked_long",
        label: "After the vehicle was parked for a long time",
      },
    ],
  },
  a_lefton: {
    id: "a_lefton",
    question: "Were any lights or accessories left on?",
    kind: "choice",
    options: YES_NO,
  },
  a_jump: {
    id: "a_jump",
    question: "Have you tried jump-starting it before?",
    kind: "choice",
    options: YES_NO,
  },
  a_terminals: {
    id: "a_terminals",
    question:
      "Are the battery terminals clean and tight (if you can check safely)?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes, clean and tight" },
      { id: "no", label: "No, corroded or loose" },
      { id: "cant_check", label: "Can't check" },
    ],
  },
  a_safe: {
    id: "a_safe",
    question: "Is the vehicle in a safe location?",
    kind: "choice",
    options: YES_NO,
  },
  b_click: {
    id: "b_click",
    question:
      "Do you hear any clicking sound when you turn the key / press start?",
    kind: "choice",
    options: [
      { id: "rapid", label: "Yes, rapid clicking" },
      { id: "one_click", label: "One click, then nothing" },
      { id: "none", label: "No sound at all" },
    ],
  },
  b_bright: {
    id: "b_bright",
    question: "Are the headlights bright or dim?",
    kind: "choice",
    options: [
      { id: "bright", label: "Bright" },
      { id: "dim", label: "Dim" },
      { id: "unsure", label: "Don't know" },
    ],
  },
  b_recent: {
    id: "b_recent",
    question: "Did this start after a recent battery or electrical work?",
    kind: "choice",
    options: YES_NO,
  },
  b_safe: {
    id: "b_safe",
    question: "Is the vehicle in a safe location?",
    kind: "choice",
    options: YES_NO,
  },
  c_howlong: {
    id: "c_howlong",
    question: "How long has this weak cranking been happening?",
    kind: "choice",
    options: [
      { id: "today", label: "Just started today" },
      { id: "days", label: "A few days" },
      { id: "weeks", label: "Weeks or more" },
      { id: "unsure", label: "Don't know" },
    ],
  },
  c_eventual: {
    id: "c_eventual",
    question: "Does it eventually start or does it fail completely?",
    kind: "choice",
    options: [
      { id: "eventually", label: "Eventually starts" },
      { id: "fails", label: "Fails completely" },
      { id: "sometimes", label: "Sometimes starts" },
    ],
  },
  c_idle: {
    id: "c_idle",
    question: "Any recent long periods of not driving the vehicle?",
    kind: "choice",
    options: YES_NO,
  },
  c_age: {
    id: "c_age",
    question: "Battery age (if known)?",
    kind: "choice",
    options: [
      { id: "under_1", label: "Under 1 year" },
      { id: "1_2", label: "1-2 years" },
      { id: "3_4", label: "3-4 years" },
      { id: "over_4", label: "Over 4 years" },
      { id: "unsure", label: "Don't know" },
    ],
  },
  d_often: {
    id: "d_often",
    question: "How often does the battery go flat?",
    kind: "choice",
    options: [
      { id: "every_few_days", label: "Every few days" },
      { id: "weekly", label: "About once a week" },
      { id: "monthly", label: "Once a month or less" },
      { id: "overnight", label: "After sitting overnight" },
    ],
  },
  d_lefton: {
    id: "d_lefton",
    question: "Do you leave lights, radio, or chargers on?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "sometimes", label: "Sometimes" },
    ],
  },
  d_warning: {
    id: "d_warning",
    question: "Does the battery warning light come on while driving?",
    kind: "choice",
    options: YES_NO,
  },
  d_altchecked: {
    id: "d_altchecked",
    question: "Has the alternator or charging system been checked before?",
    kind: "choice",
    options: [
      { id: "checked", label: "Yes, checked" },
      { id: "never", label: "No, never" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  e_suspect: {
    id: "e_suspect",
    question: "Do you already suspect the battery is bad?",
    kind: "choice",
    options: [
      { id: "definitely", label: "Yes, definitely" },
      { id: "maybe", label: "Maybe" },
      { id: "no", label: "No" },
    ],
  },
  e_test_first: {
    id: "e_test_first",
    question:
      "Do you want the technician to test it first or supply a new battery?",
    kind: "choice",
    options: [
      { id: "test", label: "Test it first" },
      { id: "supply", label: "Supply a new battery" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  e_brand: {
    id: "e_brand",
    question: "Preferred battery type or brand (if any)?",
    kind: "text",
    placeholder: "Preferred battery type or brand (if any)?",
  },
  f_sudden: {
    id: "f_sudden",
    question: "Did the light come on suddenly or gradually?",
    kind: "choice",
    options: [
      { id: "suddenly", label: "Suddenly" },
      { id: "gradually", label: "Gradually" },
    ],
  },
  f_dim: {
    id: "f_dim",
    question: "Are the headlights or dashboard lights becoming dim?",
    kind: "choice",
    options: YES_NO_UNSURE,
  },
  f_stall: {
    id: "f_stall",
    question: "Has the vehicle stalled or lost power recently?",
    kind: "choice",
    options: YES_NO,
  },
  f_smell: {
    id: "f_smell",
    question: "Any unusual smell or noise from the engine bay?",
    kind: "choice",
    options: YES_NO_UNSURE,
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
      { id: "engine", label: "Engine or mechanical problem" },
      { id: "tyre", label: "Tyre or wheel problem" },
      { id: "towing", label: "Vehicle cannot move and needs towing" },
      { id: "body", label: "Body damage or accident" },
      { id: "ac", label: "Air conditioning" },
      { id: "electrical", label: "Wiring, lights, or other electrical issues" },
      { id: "power", label: "Power at home or shop" },
      { id: "house", label: "House repair" },
      { id: "clothing", label: "Clothing" },
      { id: "battery", label: "Still battery / starting related" },
    ],
  },
  g_power: {
    id: "g_power",
    question: "Power at home or shop",
    kind: "choice",
    options: [
      { id: "generator", label: "Generator" },
      { id: "solar", label: "Solar" },
    ],
  },
  g_house: {
    id: "g_house",
    question: "House repair",
    kind: "choice",
    options: [
      { id: "carpenter", label: "Carpenter" },
      { id: "plumber", label: "Plumber" },
      { id: "painter", label: "Painter" },
    ],
  },
  ev_type: {
    id: "ev_type",
    question: "Which EV battery issue?",
    kind: "choice",
    options: [
      {
        id: "12v",
        label: "12V auxiliary battery (won't start / go into ready)",
      },
      { id: "hv", label: "High-voltage (HV) battery / range problem" },
      { id: "charging", label: "Charging problem / won't charge" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  ev_safe: {
    id: "ev_safe",
    question: "Is the vehicle in a safe location?",
    kind: "choice",
    options: YES_NO,
  },
};
