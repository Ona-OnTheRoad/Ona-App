import type { ProService } from "@/lib/types";
import { PROFESSION_FOCUS } from "./focus";
import { YES_NO, withOther, type ProfessionQuestion } from "./shared";

export function bank(
  service: ProService,
  extras: ProfessionQuestion[],
): ProfessionQuestion[] {
  const focus = PROFESSION_FOCUS[service];
  // Every multiselect gets "Other" + free-text when selected
  const extrasWithOther = extras.map((q) =>
    q.type === "multiselect" && q.options
      ? { ...q, options: withOther(q.options) }
      : q,
  );
  return [
    {
      id: "core_focus",
      label: "What do customers usually call you for?",
      hint: "Pick your real strengths. Customers will match you on these.",
      type: "multiselect",
      required: true,
      options: withOther(focus),
      maxSelect: service === "mechanic" ? 6 : 4,
    },
    ...extrasWithOther,
    {
      id: "night_weekend",
      label: "Can you work nights or weekends?",
      type: "select",
      required: true,
      options: YES_NO,
    },
    {
      id: "own_transport",
      label: "Do you have your own transport to jobs?",
      type: "select",
      required: true,
      options: YES_NO,
    },
  ];
}
