import type { MechanicScreen } from "./types";
import {
  MECHANIC_START_OPTIONS,
  MECHANIC_START_QUESTION,
  YES_NO,
} from "./constants";

export const MECHANIC_SCREENS_A: Record<string, MechanicScreen> = {
  start: {
    id: "start",
    question: MECHANIC_START_QUESTION,
    kind: "choice",
    options: MECHANIC_START_OPTIONS,
  },
  a_what: {
    id: "a_what",
    question: "When you turn the key or press the start button, what happens?",
    kind: "choice",
    options: [
      { id: "silent", label: "Completely silent / nothing happens" },
      { id: "lights_no_crank", label: "Lights come on but no cranking sound" },
      { id: "cranks_no_start", label: "Cranks normally but does not start" },
      { id: "weak_crank", label: "Cranks very slowly / weakly" },
    ],
  },
  a_lights: {
    id: "a_lights",
    question: "Are the dashboard lights and headlights working?",
    kind: "choice",
    options: [
      { id: "normal", label: "Yes, normal" },
      { id: "dim", label: "Yes, but very dim" },
      { id: "none", label: "No lights at all" },
    ],
  },
  a_when: {
    id: "a_when",
    question:
      "Did this happen suddenly or after the car was parked for a long time?",
    kind: "choice",
    options: [
      { id: "suddenly", label: "Suddenly" },
      {
        id: "parked_long",
        label: "After the car was parked for a long time",
      },
    ],
  },
  a_recent: {
    id: "a_recent",
    question: "Any recent battery, electrical, or jump-start work?",
    kind: "choice",
    options: YES_NO,
  },
  a_danger: {
    id: "a_danger",
    question: "Is the vehicle in a dangerous location?",
    kind: "choice",
    options: YES_NO,
  },
  b_how: {
    id: "b_how",
    question: "How did it stop?",
    kind: "choice",
    options: [
      { id: "suddenly", label: "Suddenly like someone switched it off" },
      { id: "shook", label: "Shook, jerked or sputtered first" },
      { id: "gradual", label: "Lost power gradually" },
    ],
  },
  b_warning: {
    id: "b_warning",
    question: "Any warning light on before or when it stopped?",
    kind: "choice",
    options: [
      { id: "battery", label: "Battery light" },
      { id: "check_engine", label: "Check engine light" },
      { id: "temperature", label: "Temperature light" },
      { id: "oil", label: "Oil light" },
      { id: "none", label: "None" },
    ],
  },
  b_restart: {
    id: "b_restart",
    question: "Does it restart after waiting a few minutes?",
    kind: "choice",
    options: YES_NO,
  },
  b_load: {
    id: "b_load",
    question:
      "Did this happen under load (climbing, accelerating) or at any time?",
    kind: "choice",
    options: [
      { id: "under_load", label: "Under load (climbing, accelerating)" },
      { id: "any_time", label: "At any time" },
    ],
  },
  b_move: {
    id: "b_move",
    question: "Can the vehicle move safely?",
    kind: "choice",
    options: YES_NO,
  },
  c_where: {
    id: "c_where",
    question: "Where is the noise coming from?",
    kind: "choice",
    options: [
      { id: "engine", label: "Engine area (front)" },
      { id: "under", label: "Under the car" },
      { id: "wheels", label: "Wheels / tyres" },
      { id: "exhaust", label: "Exhaust" },
      { id: "cabin", label: "Inside the cabin" },
    ],
  },
  c_when: {
    id: "c_when",
    question: "When does the noise happen?",
    kind: "choice",
    options: [
      { id: "idle", label: "Only when the engine is running (idle)" },
      { id: "moving", label: "Only when moving" },
      { id: "turning", label: "When turning" },
      { id: "braking", label: "When braking" },
      { id: "always", label: "Always" },
    ],
  },
  c_sound: {
    id: "c_sound",
    question: "What does the noise sound like?",
    kind: "choice",
    options: [
      { id: "knocking", label: "Knocking / metallic" },
      { id: "whining", label: "Whining / whistling" },
      { id: "grinding", label: "Grinding" },
      { id: "squealing", label: "Squealing" },
      { id: "rattling", label: "Rattling" },
    ],
  },
  c_safe: {
    id: "c_safe",
    question: "Is the vehicle safe to drive?",
    kind: "choice",
    options: YES_NO,
  },
  d_red: {
    id: "d_red",
    question:
      "Is the temperature needle in the red or is there a warning light?",
    kind: "choice",
    options: YES_NO,
  },
  d_steam: {
    id: "d_steam",
    question: "Is there steam or coolant leaking under the car?",
    kind: "choice",
    options: YES_NO,
  },
  d_fan: {
    id: "d_fan",
    question: "Does the engine fan come on?",
    kind: "choice",
    options: YES_NO,
  },
  d_when: {
    id: "d_when",
    question: "When did it start overheating?",
    kind: "choice",
    options: [
      { id: "long_drive", label: "After long drive" },
      { id: "traffic", label: "In traffic" },
      { id: "suddenly", label: "Suddenly" },
    ],
  },
  d_ac: {
    id: "d_ac",
    question: "Was the A/C recently worked on?",
    kind: "choice",
    options: YES_NO,
  },
  d_safe: {
    id: "d_safe",
    question: "Is it safe to drive?",
    kind: "choice",
    options: YES_NO,
  },
  e_color: {
    id: "e_color",
    question: "What colour is the smoke?",
    kind: "choice",
    options: [
      { id: "white", label: "White" },
      { id: "blue", label: "Blue / grey" },
      { id: "black", label: "Black" },
      { id: "smell_only", label: "No smoke, only burning smell" },
    ],
  },
  e_where: {
    id: "e_where",
    question: "Where is the smoke coming from?",
    kind: "choice",
    options: [
      { id: "bonnet", label: "Bonnet" },
      { id: "exhaust", label: "Exhaust" },
      { id: "under", label: "Under the car" },
    ],
  },
  f_color: {
    id: "f_color",
    question: "What colour is the fluid?",
    kind: "choice",
    options: [
      { id: "oil", label: "Black / brown (oil)" },
      { id: "coolant", label: "Green / red / blue (coolant)" },
      { id: "clear", label: "Clear / yellowish (fuel or brake fluid)" },
      { id: "unknown", label: "I don’t know" },
    ],
  },
  f_where: {
    id: "f_where",
    question: "Where is the leak coming from?",
    kind: "text",
    placeholder: "Where is the leak coming from?",
  },
  f_safe: {
    id: "f_safe",
    question: "Is the vehicle safe to drive?",
    kind: "choice",
    options: YES_NO,
  },
};
