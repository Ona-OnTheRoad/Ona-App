import type { PainterScreen } from "./types";

export const PAINTER_SCREENS_B: Record<string, PainterScreen> = {
  d_need: {
    question: "What exactly needs painting?",
    kind: "choice",
    options: [
      { id: "stall-table", label: "Market stall / table" },
      { id: "kiosk", label: "Roadside kiosk or container" },
      { id: "booth", label: "Temporary booth" },
      { id: "display", label: "Display shelves or boards" },
    ],
  },
  d_fresh: {
    question: "Is it a fresh paint or repainting of an old stall?",
    kind: "choice",
    options: [
      { id: "fresh", label: "Fresh paint" },
      { id: "repaint", label: "Repainting of old stall" },
    ],
  },
  d_sign: {
    question: "Do you need any sign writing or product names written on it?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
    ],
  },

  // Branch E gate, fence, railing or burglary proof
  e_need: {
    question: "What needs painting?",
    kind: "choice",
    options: [
      { id: "gate", label: "Main gate" },
      { id: "fence", label: "Fence / perimeter" },
      { id: "railing", label: "Railing / balcony" },
      { id: "burglary", label: "Burglary proof" },
      { id: "all", label: "All of the above" },
    ],
  },
  e_material: {
    question: "Is it metal, wood, or concrete?",
    kind: "choice",
    options: [
      { id: "metal", label: "Metal" },
      { id: "wood", label: "Wood" },
      { id: "concrete", label: "Concrete" },
      { id: "combination", label: "A combination" },
    ],
  },
  e_rust: {
    question: "Does it need anti-rust treatment before painting?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "not-sure", label: "I'm not sure" },
    ],
  },
  e_colour: {
    question: "What colour or finish do you want?",
    kind: "text",
    placeholder: "e.g. Black gloss or dark green",
  },

  // Branch F roof painting
  f_roof: {
    question: "What type of roof is it?",
    kind: "choice",
    options: [
      { id: "corrugated", label: "Corrugated iron sheet" },
      { id: "aluminium", label: "Aluminium long-span" },
      { id: "concrete", label: "Concrete roof" },
      { id: "other", label: "Other" },
    ],
  },
  f_purpose: {
    question:
      "Is the main purpose beautification, heat reduction, or waterproofing?",
    kind: "choice",
    options: [
      { id: "beautification", label: "Beautification" },
      { id: "heat-reduction", label: "Heat reduction" },
      { id: "waterproofing", label: "Waterproofing" },
      { id: "combination", label: "A combination" },
    ],
  },
  f_paint: {
    question:
      "Do you already have the special roof paint or should the painter supply it?",
    kind: "choice",
    options: [
      { id: "i-have", label: "I already have it" },
      { id: "painter-supplies", label: "Painter should supply it" },
    ],
  },
  f_height: {
    question: "How high is the building (storey)?",
    kind: "text",
    placeholder: "e.g. Single storey",
  },

  // Branch G church, school, mosque or public building
  g_type: {
    question: "What type of building is it?",
    kind: "text",
    placeholder: "e.g. Church or school hall",
  },
  g_scope: {
    question: "Interior, exterior, or both?",
    kind: "choice",
    options: [
      { id: "interior", label: "Interior" },
      { id: "exterior", label: "Exterior" },
      { id: "both", label: "Both" },
    ],
  },
  g_size: {
    question: "Approximate size or number of rooms/halls?",
    kind: "text",
    placeholder: "e.g. 2 halls and 4 classrooms",
  },
  g_colour: {
    question:
      "Any special colour or design requirement (e.g. church colours, school colours)?",
    kind: "text",
    placeholder: "e.g. Church blue and white",
  },
  g_supply: {
    question: "Who is supplying the paint?",
    kind: "choice",
    options: [
      { id: "i-will-supply", label: "I will supply" },
      { id: "painter-supplies", label: "Painter should supply" },
    ],
  },

  // Branch H sign writing, branding or wall design
  h_need: {
    question: "What do you need?",
    kind: "choice",
    options: [
      { id: "shop-name-logo", label: "Shop name and logo on the wall" },
      { id: "mural", label: "Full wall branding / mural" },
      { id: "directional", label: "Directional signs" },
      { id: "price-list", label: "Product list or price list on wall" },
      { id: "decorative", label: "Decorative wall design" },
    ],
  },
  h_design: {
    question: "Do you already have the design or logo in soft copy?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes" },
      { id: "no", label: "No" },
      { id: "not-yet", label: "Not yet" },
    ],
  },
  h_wall: {
    question: "Is it for indoor or outdoor wall?",
    kind: "choice",
    options: [
      { id: "indoor", label: "Indoor" },
      { id: "outdoor", label: "Outdoor" },
      { id: "both", label: "Both" },
    ],
  },

  // Branch I something else / not sure
  i_describe: {
    question: "Please describe the painting work you need in your own words.",
    kind: "text",
    placeholder: "Describe the painting work…",
  },
  i_location: {
    question: "Is it for house, shop, roadside, factory, or another location?",
    kind: "choice",
    options: [
      { id: "house", label: "House" },
      { id: "shop", label: "Shop" },
      { id: "roadside", label: "Roadside" },
      { id: "factory", label: "Factory" },
      { id: "other", label: "Other" },
    ],
  },
};
