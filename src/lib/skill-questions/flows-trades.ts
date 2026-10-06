import { SKILL_AGREEMENTS } from "./agreements";
import { YES_NO, withCertAndSpecialties } from "./flow-builder";
import type { SkillFlow } from "./types";

export const TRADE_SKILL_FLOWS: Record<
  "fashion" | "plumber" | "carpenter" | "painter" | "solar" | "generator",
  SkillFlow
> = {
  fashion: withCertAndSpecialties({
    skill: "fashion",
    title: "Fashion design details",
    intro: SKILL_AGREEMENTS.fashion,
    questions: [
      {
        id: "mobile",
        label: "Do you visit customers for fittings?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
      {
        id: "callout",
        label: "Can you work evenings or at weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
  plumber: withCertAndSpecialties({
    skill: "plumber",
    title: "Plumber details",
    intro: SKILL_AGREEMENTS.plumber,
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
        id: "callout",
        label: "Can you work at night or on weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
  carpenter: withCertAndSpecialties({
    skill: "carpenter",
    title: "Carpenter details",
    intro: SKILL_AGREEMENTS.carpenter,
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
        id: "callout",
        label: "Can you work at night or on weekends?",
        type: "select",
        required: true,
        public: true,
        options: [...YES_NO],
      },
    ],
  }),
  painter: withCertAndSpecialties({
    skill: "painter",
    title: "Painter details",
    intro: SKILL_AGREEMENTS.painter,
    questions: [
      {
        id: "mobileTools",
        label: "Do you come with tools and materials?",
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
  solar: withCertAndSpecialties({
    skill: "solar",
    title: "Solar details",
    intro: SKILL_AGREEMENTS.solar,
    questions: [
      {
        id: "mobileTools",
        label: "Do you install on-site?",
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
  generator: withCertAndSpecialties({
    skill: "generator",
    title: "Generator details",
    intro: SKILL_AGREEMENTS.generator,
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
