import { SOLAR_START_QUESTION } from "./constants";
import { SOLAR_START_OPTIONS } from "./options";
import type { SolarScreen } from "./types";

export const SOLAR_SCREENS: Record<string, SolarScreen> = {
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
  b_age: {
    question: "How old is the system?",
    kind: "text",
    placeholder: "e.g. About 2 years",
  },
  b_inverter: {
    question: "What size is the inverter (e.g. 2kVA, 3.5kVA, 5kVA, etc.)?",
    kind: "text",
    placeholder: "e.g. 3.5kVA",
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
  c_bank: {
    question: "How many batteries and what size of inverter?",
    kind: "text",
    placeholder: "e.g. 4 batteries, 5kVA inverter",
  },

  // Branch D solar panel cleaning or maintenance
  d_count: {
    question: "How many panels do you have?",
    kind: "text",
    placeholder: "e.g. 6 panels",
  },
  d_last: {
    question: "When last were the panels cleaned?",
    kind: "text",
    placeholder: "e.g. Over 6 months ago",
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
    kind: "text",
    placeholder: "e.g. Add a fridge and freezer",
  },

  // Branch F something else / not sure
  f_describe: {
    question:
      "Please describe the solar issue or what you want in your own words.",
    kind: "text",
    placeholder: "Describe the solar issue…",
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
