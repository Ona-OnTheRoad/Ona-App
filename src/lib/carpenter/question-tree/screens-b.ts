import type { CarpenterScreen } from "./types";

export const CARPENTER_SCREENS_B: Record<string, CarpenterScreen> = {
  e_need: {
    question: "What do you need?",
    kind: "choice",
    options: [
      { id: "kitchen-cabinets", label: "Kitchen cabinets (upper and lower)" },
      { id: "wardrobe", label: "Wardrobe (sliding or hinged)" },
      { id: "tv-unit", label: "TV unit / wall unit" },
      { id: "pantry", label: "Store or pantry shelves" },
      { id: "shoe-rack", label: "Shoe rack or other storage" },
    ],
  },
  e_space: {
    question:
      "Is the space already tiled/finished or still under construction?",
    kind: "choice",
    options: [
      { id: "finished", label: "Tiled / finished" },
      { id: "under-construction", label: "Still under construction" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  e_design: {
    question: "Do you have the design or measurements?",
    kind: "choice",
    options: [
      { id: "design-and-measurements", label: "Yes, design and measurements" },
      { id: "measurements-only", label: "I have measurements only" },
      { id: "no", label: "No, let the carpenter advise" },
    ],
  },
  e_material: {
    question:
      "Who is supplying the material (plywood, MDF, formica, handles, etc.)?",
    kind: "choice",
    options: [
      { id: "i-have", label: "I already have the material" },
      {
        id: "carpenter-supplies",
        label: "Carpenter should supply the material",
      },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch F office, shop, church or commercial furniture
  f_place: {
    question: "What type of place is it?",
    kind: "choice",
    options: [
      { id: "office", label: "Office" },
      { id: "shop", label: "Shop / market store" },
      { id: "church", label: "Church / mosque / fellowship" },
      { id: "school", label: "School or training centre" },
      { id: "hotel", label: "Hotel / restaurant" },
      { id: "other", label: "Other commercial space" },
    ],
  },
  f_items: {
    question: "What items do you need?",
    kind: "choice",
    options: [
      { id: "desks-chairs", label: "Office desks and chairs" },
      { id: "reception-desk", label: "Reception desk" },
      { id: "shelves-display", label: "Shelves and display units" },
      { id: "pews-benches", label: "Church pews / benches" },
      { id: "counter-bar", label: "Counter or bar" },
      { id: "partitioning", label: "Full office partitioning with wood" },
    ],
  },
  f_setup: {
    question: "Is it a new setup or renovation of existing furniture?",
    kind: "choice",
    options: [
      { id: "new-setup", label: "New setup" },
      { id: "renovation", label: "Renovation of existing" },
      { id: "both", label: "Both" },
    ],
  },

  // Branch G roadside, market stall or temporary structure
  g_need: {
    question: "What do you need?",
    kind: "choice",
    options: [
      { id: "stall-table", label: "Market stall / table" },
      { id: "kiosk", label: "Roadside kiosk or container woodwork" },
      { id: "event-booth", label: "Temporary event booth or canopy structure" },
      { id: "display-shelves", label: "Display shelves for goods" },
      { id: "stall-repair", label: "Repair of existing stall" },
    ],
  },
  g_duration: {
    question:
      "Is it for permanent use or temporary (e.g. for a few weeks/months)?",
    kind: "choice",
    options: [
      { id: "permanent", label: "Permanent use" },
      { id: "temporary", label: "Temporary use" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  g_mobile: {
    question: "Do you need it made mobile (with wheels) or fixed?",
    kind: "choice",
    options: [
      { id: "mobile", label: "Mobile (with wheels)" },
      { id: "fixed", label: "Fixed" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch H general carpentry and other woodworks
  h_describe: {
    question: "Please describe the work you need in your own words.",
    kind: "text",
    placeholder: "Describe the woodwork you want…",
  },
  h_location: {
    question: "Is it indoor or outdoor work?",
    kind: "choice",
    options: [
      { id: "indoor", label: "Indoor" },
      { id: "outdoor", label: "Outdoor" },
      { id: "both", label: "Both" },
    ],
  },
  h_wood: {
    question: "Do you already have the wood and materials?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes, I have them" },
      { id: "no", label: "No, carpenter should supply" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch I something else / not sure
  i_explain: {
    question:
      "Just explain what you want the furniture maker / carpenter to do.",
    kind: "text",
    placeholder: "Describe what you want…",
  },
  i_location: {
    question: "Is it for house, shop, office, roadside, or another location?",
    kind: "choice",
    options: [
      { id: "house", label: "House" },
      { id: "shop", label: "Shop" },
      { id: "office", label: "Office" },
      { id: "roadside", label: "Roadside / market" },
      { id: "other", label: "Other" },
    ],
  },
};
