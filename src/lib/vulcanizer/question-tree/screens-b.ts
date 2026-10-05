import type { VulcanizerScreen } from "./types";
import { YES_NO } from "./constants";

export const VULCANIZER_SCREENS_B: Record<string, VulcanizerScreen> = {
  e_symptoms: {
    id: "e_symptoms",
    question: "What symptoms are you noticing?",
    kind: "choice",
    options: [
      { id: "vibration", label: "Steering wheel vibration" },
      { id: "pull", label: "Car pulling to one side" },
      { id: "wear", label: "Uneven tyre wear" },
      { id: "loose", label: "Steering feels loose / off-centre" },
    ],
  },
  e_last: {
    id: "e_last",
    question: "When did you last do balancing or alignment?",
    kind: "choice",
    options: [
      { id: "recent", label: "Recently" },
      { id: "months", label: "A few months ago" },
      { id: "year", label: "A year or more" },
      { id: "never", label: "Never / not sure" },
    ],
  },
  e_trigger: {
    id: "e_trigger",
    question:
      "Did this start after hitting a pothole or after new tyres were fitted?",
    kind: "choice",
    options: [
      { id: "pothole", label: "After hitting a pothole" },
      { id: "new_tyres", label: "After new tyres were fitted" },
      { id: "gradual", label: "No gradual" },
    ],
  },
  // Branch F new tyres / replacement
  f_which: {
    id: "f_which",
    question: "Which tyre(s) need replacement?",
    kind: "choice",
    options: [
      { id: "front_left", label: "Front left" },
      { id: "front_right", label: "Front right" },
      { id: "rear_left", label: "Rear left" },
      { id: "rear_right", label: "Rear right" },
      { id: "both_front", label: "Both front" },
      { id: "both_rear", label: "Both rear" },
      { id: "all_four", label: "All four" },
    ],
  },
  f_supply: {
    id: "f_supply",
    question:
      "Do you already have the new tyre(s) or should the Vulcanizer supply them?",
    kind: "choice",
    options: [
      { id: "have", label: "I already have them" },
      { id: "supply", label: "Vulcanizer should supply" },
      { id: "unsure", label: "I'm not sure" },
    ],
  },
  f_brand: {
    id: "f_brand",
    question: "Preferred tyre brand or size (if known)?",
    kind: "text",
    placeholder: "Preferred tyre brand or size (if known)?",
  },
  f_balance: {
    id: "f_balance",
    question: "Do you also want balancing after fitting?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch G multiple tyres
  g_howmany: {
    id: "g_howmany",
    question: "How many tyres are affected?",
    kind: "choice",
    options: [
      { id: "two", label: "Two" },
      { id: "three", label: "Three" },
      { id: "four", label: "Four or more" },
    ],
  },
  g_what: {
    id: "g_what",
    question: "What is wrong with them (flat, burst, worn, damaged rim)?",
    kind: "text",
    placeholder: "What is wrong with them?",
  },
  g_spare: {
    id: "g_spare",
    question: "Do you have a good spare?",
    kind: "choice",
    options: YES_NO,
  },
  g_drive: {
    id: "g_drive",
    question: "Is the vehicle currently driveable for a short distance?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch H something else
  h_describe: {
    id: "h_describe",
    question:
      "Please describe in your own words what is happening with the wheels or tyres.",
    kind: "text",
    placeholder:
      "Please describe in your own words what is happening with the wheels or tyres.",
  },
  h_related: {
    id: "h_related",
    question: "Is it related to:",
    kind: "choice",
    options: [
      { id: "engine", label: "Engine, starting, or mechanical problem" },
      { id: "battery", label: "Electrical or battery issue" },
      { id: "body", label: "Body damage or accident" },
      { id: "tow", label: "Vehicle completely stuck and needs moving" },
      { id: "power", label: "Home/shop power" },
      { id: "house", label: "House repair" },
      { id: "clothing", label: "Clothing work" },
      { id: "tyre", label: "Still tyre / wheel related" },
    ],
  },
  h_power: {
    id: "h_power",
    question: "Home/shop power",
    kind: "choice",
    options: [
      { id: "generator", label: "Generator" },
      { id: "solar", label: "Solar" },
    ],
  },
  h_house: {
    id: "h_house",
    question: "House repair",
    kind: "choice",
    options: [
      { id: "carpenter", label: "Carpenter" },
      { id: "plumber", label: "Plumber" },
      { id: "painter", label: "Painter" },
    ],
  },
};
