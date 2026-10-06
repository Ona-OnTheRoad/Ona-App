/**
 * Real-world profession questions for artisan onboarding.
 * Trade-specific only never mix auto questions into home trades.
 */

import type { ProService } from "@/lib/types";
import { AUTO_PROFESSION_QUESTIONS } from "./profession-questions/auto";
import { HOME_PROFESSION_QUESTIONS } from "./profession-questions/home";
import {
  OTHER_OPTION,
  otherAnswerKey,
  type ProfessionQuestion,
} from "./profession-questions/shared";

export { OTHER_OPTION, otherAnswerKey };
export type { ProfessionQuestion };
export { PROFESSION_FOCUS } from "./profession-questions/focus";

export const PROFESSION_QUESTIONS: Record<ProService, ProfessionQuestion[]> = {
  ...AUTO_PROFESSION_QUESTIONS,
  ...HOME_PROFESSION_QUESTIONS,
};

export function professionQuestionsFor(
  service: ProService,
): ProfessionQuestion[] {
  return PROFESSION_QUESTIONS[service] ?? PROFESSION_QUESTIONS.mechanic;
}

export function professionAnswersValid(
  service: ProService,
  answers: Record<string, string | string[]>,
): boolean {
  for (const q of professionQuestionsFor(service)) {
    if (!q.required) continue;
    const v = answers[q.id];
    if (q.type === "multiselect") {
      if (!Array.isArray(v) || v.length === 0) return false;
      // Other selected → custom text required
      if (v.includes(OTHER_OPTION)) {
        const other = answers[otherAnswerKey(q.id)];
        if (typeof other !== "string" || !other.trim()) return false;
      }
      continue;
    }
    if (typeof v !== "string" || !v.trim()) return false;
  }
  return true;
}
