import { SPECIALTIES_BY_SKILL, specialtyMaxForSkill } from "./specialties";
import type { SkillFlow, SkillQuestion } from "./types";

export const YES_NO = ["Yes", "No"] as const;

const CERT_UPLOAD: SkillQuestion = {
  id: "certificationUpload",
  label: "Upload your certificate",
  hint: "Optional. PDF, JPG or PNG (trade paper, training letter or licence)",
  type: "file",
  required: false,
  public: false,
  accept: "image/*,.pdf,application/pdf",
};

export function withCertAndSpecialties(
  flow: Omit<SkillFlow, "questions"> & {
    questions: SkillQuestion[];
  },
): SkillFlow {
  const specialtyOptions = [...SPECIALTIES_BY_SKILL[flow.skill]];
  const skillShort = flow.title
    .replace(" details", "")
    .replace(" questions", "");
  const maxSelect = specialtyMaxForSkill(flow.skill);
  const questions: SkillQuestion[] = [
    {
      id: "specialties",
      label: "My Repair Core Focus",
      hint: `Your strongholds within ${skillShort} (up to ${maxSelect}). By proceeding you accept to being able to do all work in this profession.`,
      type: "multiselect",
      required: true,
      public: true,
      maxSelect,
      options: specialtyOptions,
    },
    ...flow.questions.filter((q) => q.id !== "specialties"),
    CERT_UPLOAD,
  ];
  return {
    skill: flow.skill,
    title: flow.title,
    intro: flow.intro,
    questions,
  };
}
