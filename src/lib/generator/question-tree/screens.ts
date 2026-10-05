import { GEN_MACHINE_QUESTION, GEN_START_QUESTION } from "./constants";
import { GEN_START_OPTIONS } from "./options";
import type { GenScreen } from "./types";

export const GEN_SCREENS: Record<string, GenScreen> = {
  machine: {
    kind: "choice",
    question: GEN_MACHINE_QUESTION,
  },
  start: {
    kind: "choice",
    question: GEN_START_QUESTION,
    options: GEN_START_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
  },

  // A, New generator installation or purchase advice
  a_property: {
    kind: "choice",
    question: "What type of property is it?",
    options: [
      { id: "residential", label: "Residential house / flat" },
      { id: "shop", label: "Shop / office" },
      { id: "church", label: "Church / mosque / school" },
      { id: "factory", label: "Factory / industrial" },
      { id: "other", label: "Other" },
    ],
  },
  a_power: {
    kind: "choice",
    question: "What do you want the generator to power?",
    options: [
      { id: "lights", label: "Lights and fans only" },
      { id: "lights-tv", label: "Lights, fans, TV and fridge" },
      {
        id: "full-house",
        label: "Full house (including A/C and pumping machine)",
      },
      { id: "shop", label: "Shop or office equipment" },
      { id: "heavy", label: "Heavy machines / industrial load" },
    ],
  },
  a_type: {
    kind: "choice",
    question: "Preferred type?",
    options: [
      { id: "petrol", label: "Petrol" },
      { id: "diesel", label: "Diesel" },
      { id: "advise", label: "I don't know - advise me" },
    ],
  },
  a_size: {
    kind: "choice",
    question: "Preferred size range (if known)?",
    options: [
      { id: "below-5", label: "Below 5kVA" },
      { id: "5-10", label: "5kVA - 10kVA" },
      { id: "10-20", label: "10kVA - 20kVA" },
      { id: "above-20", label: "Above 20kVA" },
      { id: "calculate", label: "I don't know - calculate for me" },
    ],
  },
  a_supply: {
    kind: "choice",
    question: "Who is supplying the generator?",
    options: [
      { id: "i-will", label: "I will buy it myself" },
      { id: "technician", label: "Technician should supply it" },
    ],
  },
  a_changeover: {
    kind: "text",
    question: "Do you need automatic change-over or manual change-over?",
    placeholder: "e.g. Automatic change-over",
  },

  // B, Generator will not start
  b_start: {
    kind: "choice",
    question: "What happens when you try to start it?",
    options: [
      { id: "dead", label: "Completely dead / no response" },
      { id: "cranks", label: "Cranks but does not start" },
      { id: "dies", label: "Starts then dies immediately" },
      { id: "hard", label: "Difficult to start (takes many tries)" },
    ],
  },
  b_type: {
    kind: "text",
    question: "Is it petrol or diesel?",
    placeholder: "e.g. Petrol",
  },
  b_service: {
    kind: "text",
    question: "When last was it serviced?",
    placeholder: "e.g. 3 months ago",
  },
  b_fuel: {
    kind: "text",
    question: "Is there fuel in the tank?",
    placeholder: "e.g. Yes, it is full",
  },
  b_work: {
    kind: "text",
    question: "Any recent work done on it?",
    placeholder: "e.g. No, nothing recently",
  },

  // C, Generator starts but does not give power
  c_output: {
    kind: "text",
    question:
      "Does the engine run normally but there is no electricity output?",
    placeholder: "e.g. Yes, engine runs fine but no power",
  },
  c_voltage: {
    kind: "text",
    question: "Is the voltage too low or fluctuating?",
    placeholder: "e.g. Lights flicker",
  },
  c_load: {
    kind: "text",
    question: "Does it only happen when you connect heavy load?",
    placeholder: "e.g. No, it fails even on small load",
  },
  c_changeover: {
    kind: "text",
    question: "Is the change-over switch working?",
    placeholder: "e.g. I think so",
  },

  // D, Generator servicing or maintenance
  d_service: {
    kind: "choice",
    question: "What kind of service do you need?",
    options: [
      { id: "normal", label: "Normal servicing (oil, filter, plug)" },
      { id: "overhaul", label: "Major overhaul" },
      { id: "make-work", label: "I don't know - just make it work well" },
    ],
  },
  d_last: {
    kind: "text",
    question: "How long has it been since the last service?",
    placeholder: "e.g. Over a year",
  },
  d_spec: {
    kind: "text",
    question: "Is it petrol or diesel and what is the size (kVA)?",
    placeholder: "e.g. Diesel 7.5kVA",
  },
  d_problem: {
    kind: "text",
    question:
      "Are you experiencing any specific problem (smoke, noise, high fuel consumption, etc.)?",
    placeholder: "e.g. Black smoke when loaded",
  },

  // E, Change-over switch or wiring problem
  e_issue: {
    kind: "choice",
    question: "What exactly is the issue?",
    options: [
      { id: "not-working", label: "Change-over not working" },
      { id: "manual-hard", label: "Manual change-over difficult to operate" },
      {
        id: "auto-detect",
        label: "Automatic change-over not detecting NEPA or generator",
      },
      { id: "wiring", label: "Wiring from generator to house/shop is faulty" },
      { id: "other", label: "Other" },
    ],
  },
  e_kind: {
    kind: "text",
    question: "Is it a manual or automatic change-over?",
    placeholder: "e.g. Automatic",
  },
  e_history: {
    kind: "text",
    question: "Was it working before or is this a new installation?",
    placeholder: "e.g. New installation",
  },

  // F, Generator overheating, smoking or making unusual noise
  f_happening: {
    kind: "choice",
    question: "What is happening?",
    options: [
      { id: "overheating", label: "Overheating" },
      { id: "smoke", label: "White / blue / black smoke" },
      { id: "knocking", label: "Unusual knocking or grinding noise" },
      { id: "vibration", label: "Excessive vibration" },
      { id: "other", label: "Other" },
    ],
  },
  f_when: {
    kind: "text",
    question:
      "Does it happen immediately after starting or after running for some time?",
    placeholder: "e.g. After running for 20 minutes",
  },
  f_oil: {
    kind: "text",
    question: "Is the oil level okay (if you have checked)?",
    placeholder: "e.g. Yes, oil level is fine",
  },

  // G, Something else / I'm not sure
  g_describe: {
    kind: "text",
    question: "Please describe the generator problem in your own words.",
    placeholder: "Describe what is happening",
  },
  g_location: {
    kind: "text",
    question: "Is it for house, shop, church, factory, or another location?",
    placeholder: "e.g. Shop",
  },
};
