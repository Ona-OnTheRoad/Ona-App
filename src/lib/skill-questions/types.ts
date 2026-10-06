import type { ProService } from "@/lib/types";

export type SkillFieldType =
  "text" | "select" | "multiselect" | "boolean" | "file";

export type SkillFileValue = {
  name: string;
  /** May be omitted when payload was capped for size (signup still valid). */
  dataUrl?: string;
  mime?: string;
  hasFile?: boolean;
};

export type SkillAnswerValue = string | string[] | SkillFileValue;

export type SkillQuestion = {
  id: string;
  label: string;
  hint?: string;
  type: SkillFieldType;
  required?: boolean;
  /** Show on public profile for motorists */
  public?: boolean;
  options?: string[];
  placeholder?: string;
  accept?: string;
  /** Max selections for multiselect (default 6 for specialties) */
  maxSelect?: number;
};

export type SkillFlow = {
  skill: ProService;
  title: string;
  intro: string;
  questions: SkillQuestion[];
};
