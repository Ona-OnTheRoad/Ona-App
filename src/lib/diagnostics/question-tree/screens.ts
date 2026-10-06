import { SCAN_START_QUESTION } from "./constants";
import { SCAN_START_OPTIONS, YES_NO } from "./options";
import type { ScanScreen } from "./types";

export const SCAN_SCREENS: Record<string, ScanScreen> = {
  start: {
    id: "start",
    question: SCAN_START_QUESTION,
    kind: "choice",
    options: SCAN_START_OPTIONS,
  },
  // Branch A Check engine light or warning light is on
  a_light: {
    id: "a_light",
    question: "Which light(s) are currently on?",
    kind: "choice",
    options: [
      { id: "ce", label: "Check Engine (MIL)" },
      { id: "battery", label: "Battery / charging" },
      { id: "oil", label: "Oil pressure" },
      { id: "temp", label: "Temperature" },
      { id: "abs", label: "ABS / traction" },
      { id: "airbag", label: "Airbag" },
      { id: "other", label: "Other warning light" },
    ],
  },
  a_flash: {
    id: "a_flash",
    question: "Is the light steady or flashing?",
    kind: "choice",
    options: [
      { id: "steady", label: "Steady" },
      { id: "flashing", label: "Flashing" },
      { id: "intermittent", label: "Comes and goes" },
    ],
  },
  a_when: {
    id: "a_when",
    question: "When did the light first come on?",
    kind: "choice",
    options: [
      { id: "today", label: "Today" },
      { id: "thisweek", label: "This week" },
      { id: "thismonth", label: "This month" },
      { id: "month", label: "Over a month ago" },
      { id: "dontknow", label: "I don't remember" },
    ],
  },
  a_symptoms: {
    id: "a_symptoms",
    question:
      "Did any symptoms start at the same time (loss of power, rough idle, smoke, etc.)?",
    kind: "choice",
    options: YES_NO,
  },
  a_scanned: {
    id: "a_scanned",
    question: "Has the vehicle been scanned before for this issue?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch B Vehicle has performance problems
  b_what: {
    id: "b_what",
    question: "What exactly is the vehicle doing?",
    kind: "choice",
    options: [
      { id: "limp", label: "Loss of power / going into limp mode" },
      { id: "idle", label: "Rough idle or shaking" },
      { id: "misfire", label: "Misfiring or jerking" },
      { id: "fuel", label: "Poor fuel consumption" },
      { id: "stall", label: "Stalling" },
      { id: "other", label: "Other performance issue" },
    ],
  },
  b_when: {
    id: "b_when",
    question:
      "Does the problem happen all the time or only under certain conditions (cold, hot, accelerating, idling)?",
    kind: "choice",
    options: [
      { id: "all", label: "All the time" },
      { id: "cold", label: "Only when cold" },
      { id: "hot", label: "Only when hot" },
      { id: "accel", label: "Only when accelerating" },
      { id: "idle", label: "Only when idling" },
      { id: "other", label: "Other conditions" },
    ],
  },
  b_noise: {
    id: "b_noise",
    question: "Any unusual noises, smells, or smoke?",
    kind: "choice",
    options: YES_NO,
  },
  b_lights: {
    id: "b_lights",
    question: "Are there any warning lights on?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch C Vehicle will not start or starts with difficulty
  c_what: {
    id: "c_what",
    question: "What happens when you try to start?",
    kind: "choice",
    options: [
      { id: "dead", label: "Completely dead (no lights, no crank)" },
      { id: "crank", label: "Cranks but does not start" },
      { id: "dies", label: "Starts then dies immediately" },
      { id: "slow", label: "Cranks very slowly" },
    ],
  },
  c_lights: {
    id: "c_lights",
    question: "Are there any warning lights on the dashboard?",
    kind: "choice",
    options: YES_NO,
  },
  c_sudden: {
    id: "c_sudden",
    question:
      "Did this start suddenly or after the vehicle was parked for a long time?",
    kind: "choice",
    options: [
      { id: "sudden", label: "Started suddenly" },
      { id: "parked", label: "After being parked for a long time" },
      { id: "notsure", label: "I'm not sure" },
    ],
  },
  c_work: {
    id: "c_work",
    question: "Any recent electrical or battery work?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch D Need full system health check / preventive scan
  d_routine: {
    id: "d_routine",
    question: "Is this a routine check or before a long trip?",
    kind: "choice",
    options: [
      { id: "routine", label: "Routine check" },
      { id: "trip", label: "Before a long trip" },
      { id: "both", label: "Both" },
    ],
  },
  d_symptoms: {
    id: "d_symptoms",
    question: "Any existing minor symptoms you want investigated?",
    kind: "choice",
    options: YES_NO,
  },
  d_scope: {
    id: "d_scope",
    question:
      "Do you want only engine scan or full system scan (ABS, airbag, transmission, etc.)?",
    kind: "choice",
    options: [
      { id: "engine", label: "Engine scan only" },
      { id: "full", label: "Full system scan" },
    ],
  },
  // Branch E After repairs, want to clear codes or confirm fix
  e_repair: {
    id: "e_repair",
    question: "What repair was recently done?",
    kind: "text",
  },
  e_light: {
    id: "e_light",
    question: "Is the warning light still on or has it returned?",
    kind: "choice",
    options: [
      { id: "still", label: "Still on" },
      { id: "returned", label: "It came back" },
      { id: "off", label: "No, it's off" },
    ],
  },
  e_clear: {
    id: "e_clear",
    question: "Do you want codes cleared and a fresh scan report?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch F Something else / I'm not sure
  f_describe: {
    id: "f_describe",
    question:
      "Please describe in your own words what is happening with the vehicle.",
    kind: "text",
  },
  f_related: {
    id: "f_related",
    question: "Is it related to:",
    kind: "choice",
    options: [
      { id: "tyre", label: "Tyre or wheel problem" },
      { id: "body", label: "Body damage or accident" },
      { id: "ac", label: "Air conditioning" },
      { id: "battery", label: "Pure battery issue" },
      { id: "tow", label: "Vehicle cannot move" },
      { id: "power", label: "Home/shop power" },
      { id: "house", label: "House repairs" },
      { id: "clothing", label: "Clothing" },
      { id: "diagnosis", label: "Still needs diagnosis" },
    ],
  },
  f_power: {
    id: "f_power",
    question: "Home/shop power",
    kind: "choice",
    options: [
      { id: "generator", label: "Generator" },
      { id: "solar", label: "Solar" },
      { id: "electric", label: "Electric" },
    ],
  },
  f_house: {
    id: "f_house",
    question: "House repairs",
    kind: "choice",
    options: [
      { id: "carpenter", label: "Carpenter" },
      { id: "plumber", label: "Plumber" },
      { id: "painter", label: "Painter" },
    ],
  },
  ev_scan: {
    id: "ev_scan",
    question: "Which EV system should be scanned?",
    kind: "choice",
    options: [
      { id: "battery", label: "High-voltage (HV) battery health scan" },
      { id: "motor", label: "Motor / inverter fault codes" },
      { id: "charging", label: "Charging system check" },
      { id: "all", label: "Full EV system health check" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
};
