import type { ProService } from "@/lib/types";
import { TRADE_SKILL_FLOWS } from "./skill-questions/flows-trades";
import { VEHICLE_SKILL_FLOWS } from "./skill-questions/flows-vehicle";
import type {
  SkillAnswerValue,
  SkillFileValue,
  SkillFlow,
} from "./skill-questions/types";

export type {
  SkillAnswerValue,
  SkillFieldType,
  SkillFileValue,
  SkillFlow,
  SkillQuestion,
} from "./skill-questions/types";
export {
  CORE_SPECIALTIES,
  MAX_SPECIALTIES,
  MAX_SPECIALTIES_OTHER,
  SPECIALTIES_BY_SKILL,
  specialtyMaxForSkill,
} from "./skill-questions/specialties";
export {
  CERTIFICATION_WARNING,
  SKILL_AGREEMENTS,
} from "./skill-questions/agreements";

export const SKILL_FLOWS: Record<ProService, SkillFlow> = {
  ...VEHICLE_SKILL_FLOWS,
  ...TRADE_SKILL_FLOWS,
};

export function getSkillFlow(skill: ProService): SkillFlow {
  // Fallback protects every trade if a key is ever missing
  return SKILL_FLOWS[skill] ?? SKILL_FLOWS.mechanic;
}

export function isSkillFileValue(v: unknown): v is SkillFileValue {
  if (!v || typeof v !== "object" || !("name" in v)) return false;
  const f = v as SkillFileValue;
  if (typeof f.name !== "string" || !f.name.trim()) return false;
  // Valid when we have bytes or at least a named upload
  return Boolean(f.dataUrl || f.hasFile || f.name);
}

export function skillAnswersValid(
  skill: ProService,
  answers: Record<string, SkillAnswerValue>,
): boolean {
  const flow = getSkillFlow(skill);
  for (const q of flow.questions) {
    if (!q.required) continue;
    const v = answers[q.id];
    if (q.type === "file") {
      if (!isSkillFileValue(v)) return false;
      continue;
    }
    if (q.type === "multiselect") {
      if (!Array.isArray(v) || v.length === 0) return false;
      continue;
    }
    if (typeof v !== "string" || !v.trim()) return false;
  }
  return true;
}

export function publicSkillRows(
  skill: ProService,
  answers?: Record<string, SkillAnswerValue>,
): { label: string; value: string }[] {
  if (!answers) return [];
  const flow = getSkillFlow(skill);
  const rows: { label: string; value: string }[] = [];
  for (const q of flow.questions) {
    if (!q.public) continue;
    const v = answers[q.id];
    if (v == null) continue;
    if (isSkillFileValue(v)) {
      rows.push({ label: q.label, value: `Uploaded: ${v.name}` });
      continue;
    }
    if (Array.isArray(v)) {
      // Use stable public label for core focus
      const label = q.id === "specialties" ? "My Repair Core Focus" : q.label;
      if (v.length) rows.push({ label, value: v.join(", ") });
      continue;
    }
    if (String(v).trim()) rows.push({ label: q.label, value: String(v) });
  }
  return rows;
}

/** Pending docs = pro discovery radius capped at 2 km until admin approves. */
export const DOCS_PENDING_MAX_RADIUS_KM = 2;
