import { qaLinesForPath } from "@/lib/help-flow-progress";
import { VULCANIZER_FINAL_COPY, VULCANIZER_MIN_PHOTOS } from "./constants";
import { vulcanizerDiagnosis } from "./diagnosis";
import { vulcanizerScreen, nextVulcanizerScreen } from "./navigation";

export function composeVulcanizerProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines = qaLinesForPath({
    answers,
    next: nextVulcanizerScreen,
    screenOf: vulcanizerScreen,
  });

  if (landmark.trim()) {
    lines.push(VULCANIZER_FINAL_COPY.location);
    lines.push(landmark.trim());
  }
  if (extra.trim()) {
    lines.push(VULCANIZER_FINAL_COPY.extra);
    lines.push(extra.trim());
  }
  const diagnosis = vulcanizerDiagnosis(answers);
  if (diagnosis) {
    lines.push(VULCANIZER_FINAL_COPY.diagnosis);
    lines.push(diagnosis);
  }
  return lines.filter(Boolean).join("\n");
}

export function canFindVulcanizerPro(photoCount: number): boolean {
  return photoCount >= VULCANIZER_MIN_PHOTOS;
}
