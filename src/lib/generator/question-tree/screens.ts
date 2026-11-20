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
  a_hours: {
    kind: "choice",
    question: "How many hours a day will it usually run?",
    options: [
      { id: "1-3", label: "1 - 3 hours (short outages)" },
      { id: "4-8", label: "4 - 8 hours" },
      { id: "8-plus", label: "More than 8 hours / almost all day" },
      { id: "standby", label: "Standby only, for rare outages" },
    ],
  },
  a_type: {
    kind: "choice",
    question: "Preferred type?",
    options: [
      { id: "petrol", label: "Petrol" },
      { id: "diesel", label: "Diesel" },
      { id: "inverter", label: "Inverter (quiet, fuel-saving)" },
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
  a_noise: {
    kind: "choice",
    question: "How important is low noise?",
    options: [
      { id: "very", label: "Very important (close to neighbours or bedrooms)" },
      { id: "some", label: "Somewhat important" },
      { id: "none", label: "Not important" },
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
    kind: "choice",
    question: "Do you need automatic change-over or manual change-over?",
    options: [
      { id: "automatic", label: "Automatic change-over" },
      { id: "manual", label: "Manual change-over" },
      { id: "have", label: "I already have one installed" },
      { id: "advise", label: "I don't know - advise me" },
    ],
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
  b_method: {
    kind: "choice",
    question: "How do you start it?",
    options: [
      { id: "key", label: "Key or push button (electric start)" },
      { id: "pull", label: "Pull cord (recoil start)" },
      { id: "auto", label: "Automatic start (remote / auto-start panel)" },
    ],
  },
  b_signs: {
    kind: "choice",
    question: "Which of these do you notice when you try to start it?",
    options: [
      { id: "click", label: "Only a clicking sound (or nothing at all)" },
      { id: "slow-crank", label: "Cranks very slowly, as if the battery is weak" },
      { id: "fuel-smell", label: "Strong petrol / diesel smell or a fuel leak" },
      { id: "warning", label: "A warning light or alarm on the panel" },
      { id: "smoke", label: "Smoke or a burning smell" },
      { id: "none", label: "None of these" },
    ],
  },
  b_type: {
    kind: "choice",
    question: "Is it petrol or diesel?",
    options: [
      { id: "petrol", label: "Petrol" },
      { id: "diesel", label: "Diesel" },
      { id: "inverter", label: "Inverter (petrol)" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  b_service: {
    kind: "choice",
    question: "When last was it serviced?",
    options: [
      { id: "under-3", label: "Within the last 3 months" },
      { id: "3-6", label: "3 - 6 months ago" },
      { id: "6-12", label: "6 - 12 months ago" },
      { id: "over-12", label: "Over a year ago" },
      { id: "never", label: "Never / I don't know" },
    ],
  },
  b_fuel: {
    kind: "choice",
    question: "Is there fuel in the tank?",
    options: [
      { id: "full", label: "Yes, it is full" },
      { id: "low", label: "Low, close to empty" },
      { id: "empty", label: "Empty" },
      { id: "old", label: "Fuel has been sitting for weeks or months" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  b_work: {
    kind: "choice",
    question: "Any recent event or work done on it?",
    options: [
      { id: "none", label: "No, nothing recent" },
      { id: "repair", label: "It was repaired or serviced recently" },
      { id: "bad-fuel", label: "I just refuelled (possible bad or watery fuel)" },
      { id: "wet", label: "It got rained on or flooded" },
      { id: "moved", label: "It was moved or has been in storage" },
    ],
  },

  // C, Generator starts but does not give power
  c_output: {
    kind: "choice",
    question: "What is wrong with the power?",
    options: [
      { id: "none", label: "Engine runs but there is no power at all" },
      { id: "weak", label: "Power is weak, dim or flickering" },
      { id: "trips", label: "It runs, then cuts off when I add load" },
      { id: "partial", label: "Some sockets or one phase have no power" },
      { id: "shock", label: "Shocks, sparks or a burning smell" },
    ],
  },
  c_breaker: {
    kind: "choice",
    question: "Is the generator's own breaker or overload switch tripped?",
    options: [
      { id: "tripped-resets", label: "Yes, tripped, and it resets" },
      { id: "tripped-again", label: "It trips again as soon as I reset it" },
      { id: "not-tripped", label: "No, it is not tripped" },
      { id: "unsure", label: "I don't know where it is" },
    ],
  },
  c_voltage: {
    kind: "choice",
    question: "What does the voltage look like?",
    options: [
      { id: "none", label: "Nothing at all (bulbs and sockets dead)" },
      { id: "low", label: "Too low (bulbs dim, appliances slow)" },
      { id: "fluctuating", label: "Rises and falls (flickering)" },
      { id: "high", label: "Too high (bulbs burning out)" },
      { id: "unsure", label: "I can't tell" },
    ],
  },
  c_load: {
    kind: "choice",
    question: "When does the problem happen?",
    options: [
      { id: "always", label: "Always, even with a small load" },
      { id: "heavy", label: "Only with heavy load (A/C, pump, iron)" },
      { id: "motor", label: "When a motor or compressor starts" },
      { id: "after-time", label: "After it has run for some time" },
    ],
  },
  c_changeover: {
    kind: "choice",
    question: "Is the change-over switch working?",
    options: [
      { id: "yes", label: "Yes, it switches properly" },
      { id: "faulty", label: "No, it is faulty or stuck" },
      { id: "none", label: "I connect directly, with no change-over" },
      { id: "unsure", label: "I'm not sure" },
    ],
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
    kind: "choice",
    question: "How long has it been since the last service?",
    options: [
      { id: "under-3", label: "Under 3 months" },
      { id: "3-6", label: "3 - 6 months" },
      { id: "6-12", label: "6 - 12 months" },
      { id: "over-12", label: "Over a year" },
      { id: "never", label: "Never / I don't know" },
    ],
  },
  d_usage: {
    kind: "choice",
    question: "How is the generator used?",
    options: [
      { id: "daily-long", label: "Daily, for many hours" },
      { id: "daily-short", label: "Daily, for a few hours" },
      { id: "occasional", label: "Occasionally, during outages" },
      { id: "idle", label: "It has been idle for a long time" },
    ],
  },
  d_spec: {
    kind: "text",
    question: "Is it petrol or diesel and what is the size (kVA)?",
    placeholder: "e.g. Diesel 7.5kVA",
  },
  d_problem: {
    kind: "choice",
    question: "Are you experiencing any specific problem?",
    options: [
      { id: "none", label: "No, it is just due for service" },
      { id: "smoke", label: "Smoke (white, blue or black)" },
      { id: "noise", label: "Unusual noise or vibration" },
      { id: "fuel", label: "High fuel consumption" },
      { id: "hard-start", label: "Hard to start" },
      { id: "leak", label: "Oil or fuel leak" },
      { id: "weak", label: "Weak power or surging" },
    ],
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
    kind: "choice",
    question: "Is it a manual or automatic change-over?",
    options: [
      { id: "manual", label: "Manual (a lever or switch I operate)" },
      { id: "automatic", label: "Automatic (switches by itself)" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  e_phase: {
    kind: "choice",
    question: "Is the supply single-phase or three-phase?",
    options: [
      { id: "single", label: "Single-phase (most homes and small shops)" },
      { id: "three", label: "Three-phase (large building or industrial)" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  e_symptom: {
    kind: "choice",
    question: "What do you notice at the change-over or wiring?",
    options: [
      { id: "buzz", label: "Buzzing, humming or chattering" },
      { id: "hot", label: "It is hot, or there is a burning smell or sparks" },
      { id: "no-switch", label: "It does not switch over at all" },
      { id: "no-power", label: "It switches, but nothing downstream has power" },
      { id: "trips", label: "Breakers keep tripping" },
    ],
  },
  e_history: {
    kind: "choice",
    question: "Was it working before or is this a new installation?",
    options: [
      { id: "new", label: "New installation, it has never worked" },
      { id: "worked", label: "It worked before and stopped" },
      { id: "after-event", label: "It stopped after a surge, storm or repair" },
      { id: "intermittent", label: "It works on and off" },
    ],
  },

  // F, Generator overheating, smoking or making unusual noise
  f_happening: {
    kind: "choice",
    question: "What is happening?",
    options: [
      { id: "overheating", label: "Overheating" },
      { id: "white-smoke", label: "White smoke" },
      { id: "blue-smoke", label: "Blue smoke" },
      { id: "black-smoke", label: "Black smoke" },
      { id: "knocking", label: "Unusual knocking or grinding noise" },
      { id: "vibration", label: "Excessive vibration" },
      { id: "other", label: "Other" },
    ],
  },
  f_when: {
    kind: "choice",
    question: "When does it happen?",
    options: [
      { id: "immediately", label: "Immediately after starting" },
      { id: "after-time", label: "After running for 10 - 30 minutes" },
      { id: "heavy-load", label: "Only under heavy load" },
      { id: "sudden", label: "Suddenly, without warning" },
    ],
  },
  f_oil: {
    kind: "choice",
    question: "What is the oil level and condition?",
    options: [
      { id: "ok", label: "Checked, level and colour are fine" },
      { id: "low", label: "Low" },
      { id: "dirty", label: "Black, milky or gritty" },
      { id: "unchecked", label: "I haven't checked" },
    ],
  },
  f_also: {
    kind: "choice",
    question: "Do you notice anything else with it?",
    options: [
      { id: "leak", label: "Oil, fuel or coolant leaking" },
      { id: "burning", label: "A burning smell" },
      { id: "power-loss", label: "It loses power or surges" },
      { id: "shuts-off", label: "It shuts itself off" },
      { id: "none", label: "Nothing else" },
    ],
  },

  // G, Something else / I'm not sure
  g_describe: {
    kind: "text",
    question: "Please describe the generator problem in your own words.",
    placeholder: "Describe what is happening",
  },
  g_when: {
    kind: "choice",
    question: "When did the problem start?",
    options: [
      { id: "today", label: "Today" },
      { id: "days", label: "In the last few days" },
      { id: "week-plus", label: "More than a week ago" },
      { id: "gradual", label: "It has been getting worse slowly" },
    ],
  },
  g_location: {
    kind: "choice",
    question: "Is it for house, shop, church, factory, or another location?",
    options: [
      { id: "house", label: "House / flat" },
      { id: "shop", label: "Shop / office" },
      { id: "church", label: "Church / mosque / school" },
      { id: "factory", label: "Factory / industrial" },
      { id: "other", label: "Other" },
    ],
  },
};
