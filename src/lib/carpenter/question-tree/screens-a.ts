import type { CarpenterScreen } from "./types";
import { CARPENTER_START_QUESTION, CARPENTER_START_OPTIONS } from "./constants";

export const CARPENTER_SCREENS_A: Record<string, CarpenterScreen> = {
  start: {
    question: CARPENTER_START_QUESTION,
    kind: "choice",
    options: CARPENTER_START_OPTIONS,
  },

  // Branch A new furniture making
  a_type: {
    question: "What type of furniture do you want?",
    kind: "choice",
    options: [
      { id: "bed", label: "Bed (with or without storage)" },
      { id: "sofa", label: "Sofa / couch / settee" },
      { id: "dining", label: "Dining table and chairs" },
      { id: "centre-table", label: "Centre table / side stools" },
      { id: "tv-stand", label: "TV stand / entertainment unit" },
      { id: "bookshelf", label: "Bookshelf or display cabinet" },
      { id: "office-table", label: "Office table and chair" },
      { id: "other", label: "Other (please specify)" },
    ],
  },
  a_wood: {
    question: "Who is supplying the wood/material?",
    kind: "choice",
    options: [
      { id: "i-have", label: "I already have the wood" },
      {
        id: "carpenter-supplies",
        label: "Furniture maker should supply the wood",
      },
    ],
  },
  a_woodtype: {
    question: "Preferred type of wood (if known)?",
    kind: "choice",
    options: [
      { id: "mahogany", label: "Mahogany" },
      { id: "iroko", label: "Iroko" },
      { id: "opepe", label: "Opepe / hardwood" },
      { id: "plywood", label: "Plywood / MDF / Particle board" },
      { id: "soft-wood", label: "Soft wood" },
      { id: "advise", label: "I don’t know, advise me" },
    ],
  },
  a_design: {
    question: "Do you have a design or picture of what you want?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "not-yet", label: "Not yet" },
    ],
  },
  a_measure: {
    question: "Do you need measurement at your house/office?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
  },

  // Branch B furniture repair or restoration
  b_problem: {
    question: "What is wrong with the furniture?",
    kind: "choice",
    options: [
      { id: "broken-frame", label: "Broken leg or frame" },
      { id: "loose-joints", label: "Loose joints" },
      { id: "torn-upholstery", label: "Damaged or torn upholstery" },
      { id: "scratched-surface", label: "Scratch, crack or worn-out surface" },
      { id: "squeaking", label: "Squeaking or unstable" },
      {
        id: "full-restoration",
        label: "Complete restoration (make it look new)",
      },
    ],
  },
  b_type: {
    question: "What type of furniture is it?",
    kind: "text",
    placeholder: "e.g. Sofa, dining table or wardrobe",
  },
  b_parts: {
    question: "Do you still have the original wood or parts?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  b_where: {
    question:
      "Do you want it repaired at your location or should it be taken to the workshop?",
    kind: "choice",
    options: [
      { id: "at-location", label: "Repair at my location" },
      { id: "workshop", label: "Take it to the workshop" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch C doors, windows and door frames
  c_need: {
    question: "What exactly do you need?",
    kind: "choice",
    options: [
      {
        id: "new-door",
        label: "New door (panel door, flush door, security door, etc.)",
      },
      { id: "door-frame", label: "Door frame only" },
      { id: "window-frames", label: "Window frames and shutters" },
      { id: "repair-door", label: "Repair of existing door or frame" },
      { id: "door-alignment", label: "Door not closing or aligning properly" },
      { id: "lock-handle", label: "Lock and handle installation/repair" },
    ],
  },
  c_building: {
    question:
      "Is it for residential house, shop, office or industrial building?",
    kind: "choice",
    options: [
      { id: "residential", label: "Residential house" },
      { id: "shop", label: "Shop" },
      { id: "office", label: "Office" },
      { id: "industrial", label: "Industrial building" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  c_wood: {
    question: "Do you already have the door/wood or should it be supplied?",
    kind: "choice",
    options: [
      { id: "i-have", label: "I already have it" },
      { id: "carpenter-supplies", label: "Carpenter should supply it" },
    ],
  },
  c_install: {
    question:
      "Do you need the carpenter to remove the old one and install the new one?",
    kind: "choice",
    options: [
      {
        id: "remove-and-install",
        label: "Yes, remove the old one and install",
      },
      { id: "just-install", label: "Just install the new one" },
      { id: "no", label: "No" },
    ],
  },

  // Branch D roofing, ceiling or woodwork in the house
  d_work: {
    question: "What work is needed?",
    kind: "choice",
    options: [
      {
        id: "roofing-woodwork",
        label: "Roofing woodwork (rafters, purlins, etc.)",
      },
      {
        id: "ceiling",
        label: "Ceiling (POP related woodwork, nailing, framing)",
      },
      { id: "fascia", label: "Fascia board / barge board" },
      { id: "carport", label: "Carport or shade structure" },
      {
        id: "roof-repair",
        label: "Repair of leaking or damaged roof woodwork",
      },
    ],
  },
  d_building: {
    question: "Is it a new building or an existing house that needs repair?",
    kind: "choice",
    options: [
      { id: "new-building", label: "New building" },
      { id: "existing-repair", label: "Existing house, repair" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  d_sheet: {
    question: "What type of roofing sheet will be used (if known)?",
    kind: "text",
    placeholder: "e.g. Long span aluminium or stone-coated",
  },
  d_scaffold: {
    question: "Do you need scaffolding or can the work be done from inside?",
    kind: "choice",
    options: [
      { id: "scaffolding", label: "Scaffolding needed" },
      { id: "from-inside", label: "Can be done from inside" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch E kitchen cabinets, wardrobe or storage
};
