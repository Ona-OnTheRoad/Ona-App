import type { PainterScreen } from "./types";
import { PAINTER_START_QUESTION, PAINTER_START_OPTIONS } from "./constants";

export const PAINTER_SCREENS_A: Record<string, PainterScreen> = {
  start: {
    question: PAINTER_START_QUESTION,
    kind: "choice",
    options: PAINTER_START_OPTIONS,
  },

  // Branch A residential house painting
  a_scope: {
    question: "Is it interior, exterior, or both?",
    kind: "choice",
    options: [
      { id: "interior", label: "Interior" },
      { id: "exterior", label: "Exterior" },
      { id: "both", label: "Both" },
    ],
  },
  a_building: {
    question: "Is the house newly built or an old house that needs repainting?",
    kind: "choice",
    options: [
      { id: "newly-built", label: "Newly built" },
      { id: "old-repaint", label: "Old house, repainting" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  a_size: {
    question: "How many rooms / what is the approximate size of the area?",
    kind: "text",
    placeholder: "e.g. 3-bedroom flat, about 4 rooms",
  },
  a_paint: {
    question: "What type of paint do you prefer?",
    kind: "choice",
    options: [
      { id: "emulsion", label: "Emulsion" },
      { id: "gloss", label: "Gloss" },
      { id: "textured", label: "Textured" },
      { id: "weather-shield", label: "Weather Shield / Exterior paint" },
      { id: "advise", label: "I don’t know, advise me" },
    ],
  },
  a_supply: {
    question: "Who is supplying the paint and materials?",
    kind: "choice",
    options: [
      { id: "i-will-supply", label: "I will supply" },
      { id: "painter-supplies", label: "Painter should supply" },
    ],
  },
  a_scaffold: {
    question: "Do you need scaffolding or can the work be done with ladder?",
    kind: "choice",
    options: [
      { id: "scaffolding", label: "Scaffolding needed" },
      { id: "ladder", label: "Ladder is enough" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch B commercial / shop / office painting
  b_place: {
    question: "What type of place is it?",
    kind: "choice",
    options: [
      { id: "shop", label: "Shop / market store" },
      { id: "office", label: "Office" },
      { id: "hotel", label: "Hotel / restaurant" },
      { id: "plaza", label: "Plaza / complex" },
      { id: "other", label: "Other commercial space" },
    ],
  },
  b_scope: {
    question: "Interior, exterior, or both?",
    kind: "choice",
    options: [
      { id: "interior", label: "Interior" },
      { id: "exterior", label: "Exterior" },
      { id: "both", label: "Both" },
    ],
  },
  b_front: {
    question: "Do you need the shop front / signboard area painted as well?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
  },
  b_building: {
    question: "Is the building new or due for repainting?",
    kind: "choice",
    options: [
      { id: "newly-built", label: "Newly built" },
      { id: "repainting", label: "Due for repainting" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  b_supply: {
    question: "Who is supplying the paint?",
    kind: "choice",
    options: [
      { id: "i-will-supply", label: "I will supply" },
      { id: "painter-supplies", label: "Painter should supply" },
    ],
  },

  // Branch C industrial / factory / warehouse painting
  c_facility: {
    question: "What type of facility is it?",
    kind: "choice",
    options: [
      { id: "factory", label: "Factory" },
      { id: "warehouse", label: "Warehouse" },
      { id: "workshop", label: "Workshop" },
      { id: "plant", label: "Plant / production area" },
      { id: "other", label: "Other industrial building" },
    ],
  },
  c_surface: {
    question:
      "Is it mainly walls, steel structures, machines, or floor marking?",
    kind: "choice",
    options: [
      { id: "walls", label: "Walls" },
      { id: "steel", label: "Steel structures" },
      { id: "machines", label: "Machines" },
      { id: "floor", label: "Floor marking" },
      { id: "combination", label: "A combination" },
    ],
  },
  c_req: {
    question:
      "Are there any special requirements (anti-rust, chemical resistant, heat resistant paint, etc.)?",
    kind: "text",
    placeholder: "e.g. Anti-rust paint for steel beams",
  },
  c_vacate: {
    question:
      "Is production still ongoing or can the area be vacated for painting?",
    kind: "choice",
    options: [
      { id: "ongoing", label: "Production ongoing" },
      { id: "vacated", label: "Can be vacated" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },

  // Branch D roadside, market stall or kiosk painting
};
