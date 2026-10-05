export type ProfessionQuestion = {
  id: string;
  label: string;
  hint?: string;
  type: "text" | "select" | "multiselect";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  maxSelect?: number;
};
export const YES_NO = ["Yes", "No"];

/** Multiselect option for free-text when list has no match */
export const OTHER_OPTION = "Other";

export function otherAnswerKey(questionId: string): string {
  return `${questionId}__other`;
}

export function withOther(options: string[]): string[] {
  if (options.includes(OTHER_OPTION)) return options;
  return [...options, OTHER_OPTION];
}
