import { SOLAR_MACHINE_QUESTION, SOLAR_START_QUESTION } from "./constants";
import { SOLAR_START_OPTIONS } from "./options";
import type { SolarScreen } from "./types";

export const SOLAR_SCREENS: Record<string, SolarScreen> = {
  machine: {
    question: SOLAR_MACHINE_QUESTION,
    kind: "choice",
  },
  start: {
    question: SOLAR_START_QUESTION,
    kind: "choice",
    options: SOLAR_START_OPTIONS,
  },

  // Branch A new solar installation
  a_property: {
    question: "What type of property is it?",
    kind: "choice",
    options: [
      { id: "residential", label: "Residential house / flat" },
      { id: "shop-office", label: "Shop / office" },
      { id: "church-school", label: "Church / mosque / school" },
      { id: "factory", label: "Factory / industrial" },
      { id: "other", label: "Other" },
    ],
  },
  a_power: {
    question: "What do you mainly want to power?",
    kind: "choice",
    options: [
      { id: "lights-fans", label: "Lights and fans only" },
      { id: "lights-fridge", label: "Lights, fans, TV and fridge" },
      {
        id: "full-house",
        label: "Full house (including A/C and pumping machine)",
      },
      { id: "shop-equipment", label: "Shop or office equipment" },
      { id: "heavy-machines", label: "Heavy industrial machines" },
    ],
  },
  a_backup: {
    question: "How long should it keep your load running without NEPA?",
    kind: "choice",
    options: [
      { id: "few-hours", label: "A few hours" },
      { id: "overnight", label: "Overnight (8 - 12 hours)" },
      { id: "24h", label: "A full day" },
      { id: "independent", label: "Fully independent, no NEPA at all" },
      { id: "advise", label: "I don’t know, advise me" },
    ],
  },
  a_system: {
    question: "Preferred system type?",
    kind: "choice",
    options: [
      { id: "off-grid", label: "Off-grid (complete independence from NEPA)" },
      { id: "hybrid", label: "Hybrid (solar + NEPA)" },
      { id: "advise", label: "I don’t know, advise me" },
    ],
  },
  a_equipment: {
    question:
      "Do you already have any solar equipment (panels, inverter, batteries)?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "some", label: "Some" },
    ],
  },
  a_supply: {
    question: "Who should supply the panels, inverter and batteries?",
    kind: "choice",
    options: [
      { id: "i-buy", label: "I will buy them myself" },
      {
        id: "technician-supplies",
        label: "Solar technician should supply everything",
      },
    ],
  },
  a_roof: {
    question: "What is your roof type? (for panel mounting)",
    kind: "choice",
    options: [
      { id: "corrugated", label: "Corrugated iron sheet" },
      { id: "long-span", label: "Long-span aluminium" },
      { id: "concrete-flat", label: "Concrete flat roof" },
      { id: "other", label: "Other" },
    ],
  },

  a_budget: {
    question: "What is your budget range?",
    kind: "choice",
    options: [
      { id: "under-1m", label: "Under ₦1 million" },
      { id: "1-3m", label: "₦1 million - ₦3 million" },
      { id: "3-7m", label: "₦3 million - ₦7 million" },
      { id: "above-7m", label: "Above ₦7 million" },
      { id: "advise", label: "I’m not sure, give me options" },
    ],
  },
  // Branch B existing solar system not working properly
  b_problem: {
    question: "What exactly is the problem?",
    kind: "choice",
    options: [
      { id: "no-power", label: "System not giving power at all" },
      { id: "finishes-quickly", label: "Power finishes too quickly" },
      { id: "inverter-error", label: "Inverter showing error or alarm" },
      { id: "not-charging", label: "Panels not charging the batteries well" },
      { id: "change-over", label: "Change-over not working properly" },
      { id: "other", label: "Other" },
    ],
  },
  b_lights: {
    question: "What does the inverter display show?",
    kind: "choice",
    options: [
      { id: "blank", label: "Nothing, it is completely off" },
      { id: "fault-code", label: "A fault or error code" },
      { id: "red-light", label: "A red light or alarm beeping" },
      { id: "normal", label: "Looks normal, but power is the problem" },
      { id: "no-display", label: "There is no display or I can’t tell" },
    ],
  },
  b_when: {
    question: "When does the problem happen?",
    kind: "choice",
    options: [
      { id: "always", label: "All the time" },
      { id: "night", label: "At night, when running on batteries" },
      { id: "cloudy", label: "On cloudy or rainy days" },
      { id: "heavy-load", label: "Only with heavy load (A/C, pump, iron)" },
      { id: "after-nepa", label: "After NEPA goes or returns" },
    ],
  },
  b_age: {
    question: "How old is the system?",
    kind: "choice",
    options: [
      { id: "under-1", label: "Under 1 year" },
      { id: "1-3", label: "1 - 3 years" },
      { id: "3-5", label: "3 - 5 years" },
      { id: "over-5", label: "Over 5 years" },
    ],
  },
  b_inverter: {
    question: "What size is the inverter?",
    kind: "choice",
    options: [
      { id: "1-2", label: "1 - 2kVA" },
      { id: "3-5", label: "3 - 5kVA" },
      { id: "6-10", label: "6 - 10kVA" },
      { id: "above-10", label: "Above 10kVA" },
      { id: "unsure", label: "I’m not sure" },
    ],
  },
  b_warranty: {
    question: "Are the batteries still under warranty?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch C battery or inverter problem
  c_which: {
    question: "Which one is having issue?",
    kind: "choice",
    options: [
      { id: "batteries", label: "Batteries" },
      { id: "inverter", label: "Inverter" },
      { id: "both", label: "Both" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  c_symptom: {
    question: "What is the symptom?",
    kind: "choice",
    options: [
      { id: "not-holding", label: "Batteries not holding charge" },
      { id: "not-switching", label: "Inverter not switching on" },
      { id: "beeping", label: "Inverter beeping or showing fault code" },
      { id: "shuts-down", label: "System shuts down when load is connected" },
      { id: "other", label: "Other" },
    ],
  },
  c_type: {
    question: "Battery type (if known)?",
    kind: "choice",
    options: [
      { id: "tubular", label: "Tubular" },
      { id: "lithium", label: "Lithium" },
      { id: "agm", label: "Dry cell / AGM" },
      { id: "dont-know", label: "I don’t know" },
    ],
  },
  c_age: {
    question: "How old are the batteries?",
    kind: "choice",
    options: [
      { id: "under-1", label: "Under 1 year" },
      { id: "1-3", label: "1 - 3 years" },
      { id: "3-5", label: "3 - 5 years" },
      { id: "over-5", label: "Over 5 years" },
      { id: "unsure", label: "I don’t know" },
    ],
  },
  c_bank: {
    question: "How many batteries and what size of inverter?",
    kind: "text",
    placeholder: "e.g. 4 batteries, 5kVA inverter",
  },

  // Branch D solar panel cleaning or maintenance
  d_count: {
    question: "How many panels do you have?",
    kind: "choice",
    options: [
      { id: "1-6", label: "1 - 6 panels" },
      { id: "7-12", label: "7 - 12 panels" },
      { id: "13-24", label: "13 - 24 panels" },
      { id: "over-24", label: "More than 24 panels" },
      { id: "unsure", label: "I’m not sure" },
    ],
  },
  d_last: {
    question: "When last were the panels cleaned?",
    kind: "choice",
    options: [
      { id: "under-3", label: "Within the last 3 months" },
      { id: "3-6", label: "3 - 6 months ago" },
      { id: "6-12", label: "6 - 12 months ago" },
      { id: "never", label: "Never, or over a year ago" },
    ],
  },
  d_condition: {
    question:
      "Are the panels dirty, covered with dust, bird droppings, or shaded by trees?",
    kind: "choice",
    options: [
      { id: "dirty-dusty", label: "Dirty / dusty" },
      { id: "bird-droppings", label: "Bird droppings" },
      { id: "shaded", label: "Shaded by trees" },
      { id: "clean", label: "No, they look clean" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  d_access: {
    question: "How easy is it to reach the panels?",
    kind: "choice",
    options: [
      { id: "easy", label: "Easy, a flat roof or on the ground" },
      { id: "sloped", label: "A sloped roof" },
      { id: "high", label: "High up, needing a long ladder or safety gear" },
      { id: "unsure", label: "I’m not sure" },
    ],
  },
  d_check: {
    question:
      "Do you also want the whole system checked (connections, inverter, batteries)?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
  },

  // Branch E system upgrade or expansion
  e_upgrade: {
    question: "What do you want to upgrade?",
    kind: "choice",
    options: [
      { id: "more-panels", label: "Add more panels" },
      { id: "inverter-capacity", label: "Increase inverter capacity" },
      { id: "more-batteries", label: "Add more batteries" },
      { id: "to-lithium", label: "Change from tubular to lithium" },
      { id: "full-upgrade", label: "Full system upgrade" },
    ],
  },
  e_current: {
    question: "What is the current inverter size and battery bank?",
    kind: "text",
    placeholder: "e.g. 3.5kVA inverter, 4 tubular batteries",
  },
  e_load: {
    question: "What additional load do you want to support?",
    kind: "choice",
    options: [
      { id: "fridge", label: "Fridge or freezer" },
      { id: "ac", label: "Air conditioner" },
      { id: "pump", label: "Water pump" },
      { id: "shop", label: "Shop or office equipment" },
      { id: "whole", label: "Power the whole building" },
      { id: "other", label: "Something else" },
    ],
  },
  e_space: {
    question: "Is there space for more panels?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes, plenty of space" },
      { id: "limited", label: "Limited space" },
      { id: "no", label: "No, I’m only upgrading the inverter or batteries" },
      { id: "unsure", label: "I’m not sure" },
    ],
  },

  // Branch F something else / not sure
  f_describe: {
    question:
      "Please describe the solar issue or what you want in your own words.",
    kind: "text",
    placeholder: "Describe the solar issue…",
  },
  f_when: {
    question: "When did you notice it?",
    kind: "choice",
    options: [
      { id: "today", label: "Today" },
      { id: "days", label: "In the last few days" },
      { id: "week-plus", label: "More than a week ago" },
      { id: "new", label: "It’s not a fault, I want something new" },
    ],
  },
  f_location: {
    question: "Is it for house, shop, church, factory, or another location?",
    kind: "choice",
    options: [
      { id: "house", label: "House" },
      { id: "shop", label: "Shop" },
      { id: "church", label: "Church" },
      { id: "factory", label: "Factory" },
      { id: "other", label: "Other" },
    ],
  },
};
