import { FASHION_START_QUESTION } from "./constants";
import { FASHION_START_OPTIONS, YES_NO } from "./options";
import type { FashionScreen } from "./types";

export const FASHION_SCREENS: Record<string, FashionScreen> = {
  start: {
    id: "start",
    question: FASHION_START_QUESTION,
    kind: "choice",
    options: FASHION_START_OPTIONS,
  },
  // Branch A New custom-made outfit (Native or English)
  a_who: {
    id: "a_who",
    question: "Who is the outfit for?",
    kind: "choice",
    options: [
      { id: "men", label: "Men" },
      { id: "women", label: "Women" },
      { id: "children", label: "Children" },
      { id: "unisex", label: "Unisex / Couple" },
    ],
  },
  a_style: {
    id: "a_style",
    question: "What style do you want?",
    kind: "choice",
    options: [
      {
        id: "native",
        label:
          "Native / Traditional (Agbada, Buba & Sokoto, Iro & Buba, Kaftan, Dashiki, Senator, etc.)",
      },
      { id: "english", label: "English / Corporate" },
      {
        id: "african",
        label: "Contemporary African (Ankara mix, modern native)",
      },
      { id: "wedding", label: "Wedding / Bridal" },
      { id: "party", label: "Party / Owambe / Reception" },
      { id: "church", label: "Church / Formal event" },
      { id: "casual", label: "Casual" },
    ],
  },
  a_fabric: {
    id: "a_fabric",
    question: "Do you already have the fabric?",
    kind: "choice",
    options: [
      { id: "yes", label: "Yes, I have the material" },
      {
        id: "no",
        label:
          "No, I need the tailor to source it (Ankara, Lace, Aso-oke, George, Sequins, Velvet, etc.)",
      },
    ],
  },
  a_style_ref: {
    id: "a_style_ref",
    question:
      "Do you have a style reference (photo, screenshot, or celebrity look)?",
    kind: "choice",
    options: YES_NO,
  },
  a_ready: {
    id: "a_ready",
    question:
      "When do you need the outfit ready? (Especially important for owambe, wedding, or weekend events)",
    kind: "choice",
    options: [
      { id: "thisweek", label: "This week" },
      { id: "nextweek", label: "Next week" },
      { id: "thismonth", label: "Within the month" },
      { id: "notsure", label: "I'm not sure" },
    ],
  },
  // Branch B Aso-Ebi / Group or family uniform
  b_count: {
    id: "b_count",
    question: "How many people are involved?",
    kind: "choice",
    options: [
      { id: "few", label: "1, 2" },
      { id: "group", label: "3, 5" },
      { id: "large", label: "6, 10" },
      { id: "bulk", label: "More than 10" },
    ],
  },
  b_group: {
    id: "b_group",
    question: "Is it for:",
    kind: "choice",
    options: [
      { id: "family", label: "Family" },
      { id: "friends", label: "Friends / Age-grade" },
      { id: "church", label: "Church / Fellowship" },
      { id: "wedding", label: "Wedding guests" },
      { id: "association", label: "Political / Association" },
      { id: "other", label: "Other group" },
    ],
  },
  b_fabric: {
    id: "b_fabric",
    question: "Preferred fabric (Ankara, Lace, Aso-oke, George, etc.)?",
    kind: "choice",
    options: [
      { id: "ankara", label: "Ankara" },
      { id: "lace", label: "Lace" },
      { id: "aso", label: "Aso-oke" },
      { id: "george", label: "George" },
      { id: "other", label: "Other" },
      { id: "notsure", label: "I'm not sure" },
    ],
  },
  b_have: {
    id: "b_have",
    question: "Do you already have the fabric or should it be sourced?",
    kind: "choice",
    options: [
      { id: "have", label: "Yes, I have it" },
      { id: "source", label: "Please source it" },
    ],
  },
  b_same: {
    id: "b_same",
    question:
      "Do you want the same style for everyone or slight variations (men/women/children)?",
    kind: "choice",
    options: [
      { id: "same", label: "Same style for everyone" },
      { id: "variations", label: "Slight variations" },
    ],
  },
  b_date: {
    id: "b_date",
    question: "Event date?",
    kind: "text",
    placeholder: "e.g. 25 December",
  },
  // Branch C Alteration, adjustment or restyling of existing clothes
  c_what: {
    id: "c_what",
    question: "What needs to be done?",
    kind: "choice",
    options: [
      { id: "size", label: "Taking in / letting out (size adjustment)" },
      { id: "length", label: "Shortening or lengthening" },
      {
        id: "restyle",
        label: "Changing the style completely (e.g. old agbada to modern cut)",
      },
      {
        id: "trim",
        label: "Adding or removing embroidery, stones, or lace",
      },
      { id: "repair", label: "Zip, button, or lining repair while adjusting" },
    ],
  },
  c_native: {
    id: "c_native",
    question: "Is the original garment native or English wear?",
    kind: "choice",
    options: [
      { id: "native", label: "Native" },
      { id: "english", label: "English" },
      { id: "notsure", label: "I'm not sure" },
    ],
  },
  c_have: {
    id: "c_have",
    question:
      "Do you have the garment with you or will the tailor need to pick up / you will drop it?",
    kind: "choice",
    options: [
      { id: "have", label: "I have it" },
      { id: "pickup", label: "Tailor picks up" },
      { id: "drop", label: "I will drop it off" },
    ],
  },
  // Branch D Repair of torn, damaged or worn clothes
  d_damage: {
    id: "d_damage",
    question: "What is the damage?",
    kind: "choice",
    options: [
      { id: "tear", label: "Tear or rip" },
      { id: "worn", label: "Worn-out elbows, knees or seat" },
      { id: "embroidery", label: "Damaged embroidery or beads" },
      { id: "stain", label: "Colour run or stain that needs attention" },
      { id: "other", label: "Other" },
    ],
  },
  d_value: {
    id: "d_value",
    question:
      "Is it a high-value native wear (Aso-oke, heavy lace, agbada) or regular clothing?",
    kind: "choice",
    options: [
      { id: "high", label: "High-value native wear" },
      { id: "regular", label: "Regular clothing" },
    ],
  },
  d_repair: {
    id: "d_repair",
    question: "Do you want it repaired to look almost new or just functional?",
    kind: "choice",
    options: [
      { id: "new", label: "Almost new" },
      { id: "functional", label: "Just functional" },
    ],
  },
  // Branch E Ready-to-wear / Off-the-rack purchase & fitting
  e_looking: {
    id: "e_looking",
    question: "Are you looking for:",
    kind: "choice",
    options: [
      { id: "native", label: "Native wear already sewn" },
      { id: "english", label: "English / Corporate wear" },
      { id: "ankara", label: "Ankara ready-to-wear" },
      { id: "children", label: "Children's wear" },
      {
        id: "accessories",
        label: "Accessories (fila, gele, shoes, bags, if offered)",
      },
    ],
  },
  e_fitting: {
    id: "e_fitting",
    question: "Do you need fitting and minor adjustment after purchase?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch F Fashion design consultation or style advice
  f_advice: {
    id: "f_advice",
    question: "What do you need advice on?",
    kind: "choice",
    options: [
      {
        id: "style",
        label: "Choosing the right native style for your body type or event",
      },
      {
        id: "fabric",
        label: "Fabric selection (Ankara vs Lace vs Aso-oke etc.)",
      },
      { id: "colour", label: "Colour combination for owambe or wedding" },
      { id: "modern", label: "Modern twist on traditional wear" },
      { id: "wardrobe", label: "Full wardrobe planning" },
    ],
  },
  f_budget: {
    id: "f_budget",
    question: "Do you already have a budget range or event date?",
    kind: "choice",
    options: YES_NO,
  },
  // Branch G Something else / I'm not sure
  g_describe: {
    id: "g_describe",
    question: "Please describe in your own words what you need.",
    kind: "text",
  },
  g_related: {
    id: "g_related",
    question: "Is it related to:",
    kind: "choice",
    options: [
      { id: "vehicle", label: "Vehicle or mechanical issue" },
      { id: "house", label: "House repair" },
      { id: "power", label: "Power solutions" },
      { id: "clothing", label: "Still clothing / fabric / design related" },
    ],
  },
};
