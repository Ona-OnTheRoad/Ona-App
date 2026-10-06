import { TOW_START_QUESTION } from "./constants";
import {
  BODY_PARTS,
  TOW_START_OPTIONS,
  VEHICLE_TYPES,
  YES_NO,
} from "./options";
import type { TowScreen } from "./types";

export const TOW_SCREENS: Record<string, TowScreen> = {
  start: {
    id: "start",
    question: TOW_START_QUESTION,
    kind: "choice",
    options: TOW_START_OPTIONS,
  },
  // Branch A completely broken down
  a_what: {
    id: "a_what",
    question: "What exactly happened to the vehicle?",
    kind: "choice",
    options: [
      { id: "will_not_start", label: "Will not start at all" },
      { id: "stalled", label: "Started then stopped / stalled" },
      { id: "strange_noise", label: "Strange noise then stopped" },
      { id: "overheating", label: "Overheating" },
      { id: "transmission", label: "Transmission / gear problem" },
      { id: "other", label: "Other mechanical issue" },
    ],
  },
  a_roll: {
    id: "a_roll",
    question: "Can the wheels still roll freely when the vehicle is pushed?",
    kind: "choice",
    options: YES_NO,
  },
  a_safe: {
    id: "a_safe",
    question: "Is the vehicle currently in a safe location?",
    kind: "choice",
    options: YES_NO,
  },
  a_vehicle: {
    id: "a_vehicle",
    question: "What type of vehicle is it?",
    kind: "choice",
    options: VEHICLE_TYPES,
  },
  // Branch B accident or collision
  b_serious: {
    id: "b_serious",
    question: "How serious is the damage?",
    kind: "choice",
    options: [
      { id: "minor", label: "Minor (still driveable)" },
      { id: "moderate", label: "Moderate" },
      { id: "severe", label: "Severe (cannot move)" },
    ],
  },
  b_injured: {
    id: "b_injured",
    question: "Is anyone injured?",
    kind: "choice",
    options: YES_NO,
  },
  b_parts: {
    id: "b_parts",
    question: "Which parts of the vehicle are damaged?",
    kind: "choice",
    options: BODY_PARTS,
  },
  b_blocking: {
    id: "b_blocking",
    question: "Is the vehicle blocking the road or in a dangerous position?",
    kind: "choice",
    options: YES_NO,
  },
  b_paint: {
    id: "b_paint",
    question: "Will the damaged panels need repainting?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch C dangerous location
  c_location: {
    id: "c_location",
    question: "Exact type of location:",
    kind: "choice",
    options: [
      { id: "highway", label: "Highway / expressway" },
      { id: "busy_road", label: "Busy city road" },
      { id: "bridge", label: "Bridge or flyover" },
      { id: "dark_remote", label: "Dark or remote area" },
      { id: "estate", label: "Estate / residential" },
    ],
  },
  c_hazard: {
    id: "c_hazard",
    question: "Are the hazard lights working?",
    kind: "choice",
    options: YES_NO,
  },
  c_drive: {
    id: "c_drive",
    question:
      "Is the vehicle still driveable for a very short distance to a safer spot?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch D flat / burst tyre, cannot change
  d_count: {
    id: "d_count",
    question: "How many tyres are affected?",
    kind: "choice",
    options: [
      { id: "one", label: "One" },
      { id: "two", label: "Two" },
      { id: "more", label: "More than two" },
    ],
  },
  d_spare: {
    id: "d_spare",
    question: "Do you have a good spare tyre?",
    kind: "choice",
    options: YES_NO,
  },
  d_tools: {
    id: "d_tools",
    question: "Do you have a jack and tools?",
    kind: "choice",
    options: YES_NO,
  },
  d_safe: {
    id: "d_safe",
    question: "Is the vehicle in a safe location?",
    kind: "choice",
    options: [
      { id: "safe", label: "Safe location" },
      { id: "road", label: "On the road / unsafe" },
    ],
  },
  // Branch E move to workshop / safer place
  e_reason: {
    id: "e_reason",
    question: "Why does it need to be moved?",
    kind: "choice",
    options: [
      { id: "workshop", label: "Going to a workshop for repairs" },
      { id: "home", label: "Going home" },
      { id: "safer_place", label: "Moving to a safer place" },
      { id: "other", label: "Other" },
    ],
  },
  e_drive: {
    id: "e_drive",
    question: "Is the vehicle currently driveable?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch F stuck / sank
  f_deep: {
    id: "f_deep",
    question: "How deeply is it stuck?",
    kind: "choice",
    options: [
      { id: "slightly", label: "Slightly stuck" },
      { id: "moderate", label: "Moderately stuck" },
      { id: "deeply", label: "Deeply stuck / sank" },
    ],
  },
  f_recovery: {
    id: "f_recovery",
    question:
      "Is a normal tow truck enough, or do you need a heavy-duty / winch recovery?",
    kind: "choice",
    options: [
      { id: "normal", label: "Normal tow truck is enough" },
      { id: "heavy", label: "Heavy-duty / winch recovery" },
    ],
  },
  f_vehicle: {
    id: "f_vehicle",
    question: "What type of vehicle is it?",
    kind: "choice",
    options: VEHICLE_TYPES,
  },
  // Branch G something else / not sure
  g_desc: {
    id: "g_desc",
    question: "Please describe in your own words what is happening.",
    kind: "text",
    placeholder: "Please describe in your own words what is happening.",
  },
  g_related: {
    id: "g_related",
    question: "Is it related to:",
    kind: "choice",
    options: [
      { id: "engine_mech", label: "Engine or mechanical problem" },
      { id: "tyre_wheel", label: "Tyre or wheel problem" },
      { id: "battery_electrical", label: "Battery or electrical issue" },
      { id: "body", label: "Body damage" },
      { id: "ac", label: "Air conditioning" },
      { id: "power", label: "Power at home / shop" },
      { id: "house", label: "House repair" },
      { id: "clothing", label: "Clothing work" },
      { id: "moving", label: "Still needs moving" },
    ],
  },
  g_power: {
    id: "g_power",
    question: "Power at home / shop",
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
};
