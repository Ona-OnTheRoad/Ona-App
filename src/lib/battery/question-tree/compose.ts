import { qaLinesForPath } from "@/lib/help-flow-progress";
import { BATTERY_FINAL_COPY, BATTERY_MIN_PHOTOS } from "./constants";
import { batteryDiagnosis } from "./diagnosis";
import { START_NEXT, batteryScreen, nextBatteryScreen } from "./navigation";

export function composeBatteryProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const lines = qaLinesForPath({
    answers,
    next: nextBatteryScreen,
    screenOf: batteryScreen,
  });

  if (landmark.trim()) {
    lines.push(BATTERY_FINAL_COPY.location);
    lines.push(landmark.trim());
  }
  if (extra.trim()) {
    lines.push(BATTERY_FINAL_COPY.extra);
    lines.push(extra.trim());
  }
  const diagnosis = batteryDiagnosis(answers);
  if (diagnosis) {
    lines.push(BATTERY_FINAL_COPY.diagnosis);
    lines.push(diagnosis);
  }
  return lines.filter(Boolean).join("\n");
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length >= 2;
}

export function canFindBatteryPro(photoCount: number): boolean {
  return photoCount >= BATTERY_MIN_PHOTOS;
}

export function batteryBreadcrumb(stack: string[]): string {
  const bits: string[] = ["Battery"];
  if (stack.length > 1) {
    const firstBranch = stack[1];
    const letter = Object.entries(START_NEXT).find(
      ([, id]) => id === firstBranch,
    )?.[0];
    if (letter) bits.push(letter);
  }
  const last = stack[stack.length - 1];
  if (last === "confirm") bits.push("Confirm");
  else if (last === "final") bits.push("Send");
  return bits.join(" · ");
}
