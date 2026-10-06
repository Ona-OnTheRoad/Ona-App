import { BODY_START_QUESTION } from "./constants";
import { BODY_START_OPTIONS, YES_NO } from "./options";
import type { BodyScreen } from "./types";

export const BODY_SCREENS: Record<string, BodyScreen> = {
  start: {
    id: "start",
    question: BODY_START_QUESTION,
    kind: "choice",
    options: BODY_START_OPTIONS,
  },
  // Branch A Accident or collision damage
  a_serious: {
    id: "a_serious",
    question: "How serious is the damage?",
    kind: "choice",
    options: [
      { id: "minor", label: "Minor (still driveable)" },
      { id: "moderate", label: "Moderate" },
      { id: "severe", label: "Severe (vehicle cannot move safely)" },
    ],
  },
  a_parts: {
    id: "a_parts",
    question: "Which parts of the vehicle are affected?",
    kind: "text",
  },
  a_driveable: {
    id: "a_driveable",
    question: "Is the vehicle currently driveable?",
    kind: "choice",
    options: YES_NO,
  },
  a_insurance: {
    id: "a_insurance",
    question: "Is insurance involved?",
    kind: "choice",
    options: YES_NO,
  },
  a_safe: {
    id: "a_safe",
    question: "Is the vehicle in a safe location right now?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch B Dent(s) on the body
  b_count: {
    id: "b_count",
    question: "How many dents are there?",
    kind: "text",
  },
  b_panels: {
    id: "b_panels",
    question:
      "Which panel(s) are affected (door, fender, bonnet, boot, roof, etc.)?",
    kind: "text",
  },
  b_depth: {
    id: "b_depth",
    question: "Are the dents deep or shallow?",
    kind: "choice",
    options: [
      { id: "deep", label: "Deep" },
      { id: "shallow", label: "Shallow" },
      { id: "mixed", label: "Mixed" },
    ],
  },
  b_paint: {
    id: "b_paint",
    question: "Is the paint cracked or just the metal pushed in?",
    kind: "choice",
    options: [
      { id: "paint", label: "Paint cracked" },
      { id: "metal", label: "Metal pushed in" },
      { id: "both", label: "Both" },
    ],
  },
  b_repair: {
    id: "b_repair",
    question: "Do you want paintless dent repair or full panel beating?",
    kind: "choice",
    options: [
      { id: "pdr", label: "Paintless dent repair" },
      { id: "full", label: "Full panel beating" },
    ],
  },
  // Branch C Scratch or paint damage
  c_depth: {
    id: "c_depth",
    question: "How deep is the scratch?",
    kind: "choice",
    options: [
      { id: "surface", label: "Surface only (clear coat)" },
      { id: "colour", label: "Through to the colour" },
      { id: "metal", label: "Down to the metal" },
    ],
  },
  c_size: {
    id: "c_size",
    question: "Size of the affected area?",
    kind: "text",
  },
  c_respray: {
    id: "c_respray",
    question: "Do you want only touch-up or full panel respray?",
    kind: "choice",
    options: [
      { id: "touchup", label: "Only touch-up" },
      { id: "respray", label: "Full panel respray" },
    ],
  },
  c_paint: {
    id: "c_paint",
    question: "Is the rest of the vehicle paint in good condition?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch D Bumper damaged or hanging
  d_state: {
    id: "d_state",
    question: "Is the bumper cracked, broken, or completely hanging off?",
    kind: "choice",
    options: [
      { id: "cracked", label: "Cracked" },
      { id: "broken", label: "Broken" },
      { id: "hanging", label: "Completely hanging off" },
    ],
  },
  d_position: {
    id: "d_position",
    question: "Front or rear bumper?",
    kind: "choice",
    options: [
      { id: "front", label: "Front" },
      { id: "rear", label: "Rear" },
    ],
  },
  d_mounts: {
    id: "d_mounts",
    question: "Are the mounting points or brackets damaged?",
    kind: "choice",
    options: YES_NO,
  },
  d_drive: {
    id: "d_drive",
    question: "Is the vehicle still safe to drive?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch E Door, fender, or bonnet damage
  e_part: {
    id: "e_part",
    question: "Which specific part is damaged?",
    kind: "choice",
    options: [
      { id: "door", label: "Door" },
      { id: "fender", label: "Fender" },
      { id: "bonnet", label: "Bonnet" },
      { id: "boot", label: "Boot" },
      { id: "multiple", label: "More than one" },
      { id: "not_sure", label: "I'm not sure" },
    ],
  },
  e_opens: {
    id: "e_opens",
    question: "Does the door/bonnet still open and close properly?",
    kind: "choice",
    options: YES_NO,
  },
  e_alignment: {
    id: "e_alignment",
    question: "Is there any misalignment?",
    kind: "choice",
    options: YES_NO,
  },
  e_mechanical: {
    id: "e_mechanical",
    question:
      "Any related mechanical issue (e.g. door not locking, hinge problem)?",
    kind: "text",
  },
  // Branch F Need full panel beating and spraying
  f_areas: {
    id: "f_areas",
    question: "Which areas of the vehicle need work?",
    kind: "text",
  },
  f_quotation: {
    id: "f_quotation",
    question: "Do you already have a quotation or insurance approval?",
    kind: "choice",
    options: [
      { id: "quotation", label: "Quotation" },
      { id: "approval", label: "Insurance approval" },
      { id: "neither", label: "Neither yet" },
    ],
  },
  f_colour: {
    id: "f_colour",
    question: "Do you want the same colour or a different colour?",
    kind: "choice",
    options: [
      { id: "same", label: "Same colour" },
      { id: "different", label: "Different colour" },
    ],
  },
  f_driveable: {
    id: "f_driveable",
    question: "Is the vehicle currently driveable to the workshop?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch G Something else / I'm not sure
  g_describe: {
    id: "g_describe",
    question: "Please describe in your own words what is happening.",
    kind: "text",
  },
  g_related: {
    id: "g_related",
    question: "Is it related to:",
    kind: "choice",
    options: [
      { id: "mechanic", label: "Engine or mechanical problem" },
      { id: "vulcanizer", label: "Tyre or wheel problem" },
      { id: "battery", label: "Battery or starting issue" },
      { id: "towing", label: "Vehicle cannot move" },
      { id: "ac", label: "Air conditioning" },
      { id: "electrical", label: "Electrical or wiring" },
      { id: "power", label: "Power at home/shop" },
      { id: "house", label: "House repair" },
      { id: "fashion", label: "Clothing" },
      { id: "body", label: "Still body/panel related" },
    ],
  },
};
