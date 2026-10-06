import type { ProService } from "@/lib/types";

export const CERTIFICATION_WARNING =
  "NOTE: If you upload fake papers, your account can be closed and you may face charges.";

/** Skill-specific agreement: full profession capability for selected brands. */
export const SKILL_AGREEMENTS: Record<ProService, string> = {
  mechanic:
    "By completing this process, you agree you can fix all engine and mechanical works of the selected motor brand(s).",
  vulcanizer:
    "By completing this process, you agree you can fix all tyre and wheel works of the selected motor brand(s).",
  towing:
    "By completing this process, you agree you can provide full tow and recovery for the selected motor brand(s).",
  battery:
    "By completing this process, you agree you can handle all battery and jump-start works of the selected motor brand(s).",
  ac: "By completing this process, you agree you can fix all air-conditioning works of the selected motor brand(s).",
  body: "By completing this process, you agree you can fix all body and paint works of the selected motor brand(s).",
  electrical:
    "By completing this process, you agree you can fix all electrical and wiring works of the selected motor brand(s).",
  diagnostics:
    "By completing this process, you agree you can run full diagnostics and scan works of the selected motor brand(s).",
  fashion:
    "By completing this process, you agree you can provide fashion design and tailoring services for the jobs you accept.",
  plumber:
    "By completing this process, you agree you can handle plumbing and water works for the jobs you accept.",
  carpenter:
    "By completing this process, you agree you can handle carpentry and woodwork for the jobs you accept.",
  painter:
    "By completing this process, you agree you can handle painting and surface finishing for the jobs you accept.",
  solar:
    "By completing this process, you agree you can handle solar and inverter works for the jobs you accept.",
  generator:
    "By completing this process, you agree you can service and repair generators for the jobs you accept.",
};
