import { SKILL_AGREEMENTS } from "./agreements";
import { YES_NO, withCertAndSpecialties } from "./flow-builder";
import type { SkillFlow } from "./types";

export const VEHICLE_SKILL_FLOWS: Record<
  | "mechanic"
  | "vulcanizer"
  | "towing"
  | "battery"
  | "ac"
  | "body"
  | "electrical"
  | "diagnostics",
  SkillFlow
> = {
  mechanic: withCertAndSpecialties({
    skill: "mechanic",
    title: "Mechanic details",
    intro: SKILL_AGREEMENTS.mechanic,
    questions: [
      {
        id: "mobileTools",
        label: "Do you come with tools?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
      {
        id: "certifications",
        label: "Name of your certificate or training",
        type: "text",
        required: true,
        public: true,
        placeholder: "e.g. Trade test, workshop training, apprenticeship",
      },
      {
        id: "callout",
        label: "Can you work at night or on weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
  vulcanizer: withCertAndSpecialties({
    skill: "vulcanizer",
    title: "Vulcanizer details",
    intro: SKILL_AGREEMENTS.vulcanizer,
    questions: [
      {
        id: "mobileCompressor",
        label: "Do you have a compressor (air machine)?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
      {
        id: "tyreSizes",
        label: "Tyre sizes you work with",
        type: "text",
        public: true,
        placeholder: "e.g. small cars, buses, motorcycles",
      },
      {
        id: "callout",
        label: "Can you work at night or on weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
  towing: withCertAndSpecialties({
    skill: "towing",
    title: "Towing details",
    intro: SKILL_AGREEMENTS.towing,
    questions: [
      {
        id: "towType",
        label: "What kind of tow vehicle do you use?",
        type: "text",
        required: true,
        public: true,
        placeholder: "e.g. flatbed, wheel lift, wrecker",
      },
      {
        id: "coverage",
        label: "How far can you go?",
        type: "text",
        public: true,
        placeholder: "e.g. within Lagos, interstate",
      },
      {
        id: "callout",
        label: "Can you work at night or on weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
  battery: withCertAndSpecialties({
    skill: "battery",
    title: "Battery details",
    intro: SKILL_AGREEMENTS.battery,
    questions: [
      {
        id: "stock",
        label: "Do you carry spare batteries?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
      {
        id: "callout",
        label: "Can you work at night or on weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
  ac: withCertAndSpecialties({
    skill: "ac",
    title: "A/C details",
    intro: SKILL_AGREEMENTS.ac,
    questions: [
      {
        id: "gasType",
        label: "Gas types you work with",
        type: "text",
        public: true,
        placeholder: "e.g. R134a, R1234yf",
      },
      {
        id: "callout",
        label: "Can you work at night or on weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
  body: withCertAndSpecialties({
    skill: "body",
    title: "Body work details",
    intro: SKILL_AGREEMENTS.body,
    questions: [
      {
        id: "mobile",
        label: "Can you work at the customer location?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
      {
        id: "callout",
        label: "Can you work at night or on weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
  electrical: withCertAndSpecialties({
    skill: "electrical",
    title: "Electrical details",
    intro: SKILL_AGREEMENTS.electrical,
    questions: [
      {
        id: "mobileTools",
        label: "Do you carry electrical tools?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
      {
        id: "callout",
        label: "Can you work at night or on weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
  diagnostics: withCertAndSpecialties({
    skill: "diagnostics",
    title: "Diagnostics details",
    intro: SKILL_AGREEMENTS.diagnostics,
    questions: [
      {
        id: "scanTool",
        label: "Scan tool you use",
        type: "text",
        required: true,
        public: true,
        placeholder: "e.g. Launch, Autel, dealer tool",
      },
      {
        id: "callout",
        label: "Can you work at night or on weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
};
