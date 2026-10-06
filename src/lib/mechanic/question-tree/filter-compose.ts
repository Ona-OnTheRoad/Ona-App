import {
  answeredScreenPath,
  pickAnswersOnPath,
  qaLinesForPath,
} from "@/lib/help-flow-progress";
import {
  MECHANIC_FINAL_COPY,
  MECHANIC_MIN_PHOTOS,
  MECHANIC_START_OPTIONS,
  MECHANIC_START_QUESTION,
} from "./constants";
import { MECHANIC_SCREENS } from "./screens";
import { START_NEXT } from "./parts";
import { mechanicDiagnosis } from "./diagnosis";
import { mechanicScreen, nextMechanicScreen } from "./navigation";

function questionKey(text: string): string {
  const qi = text.indexOf("?");
  const cut = qi >= 0 ? text.slice(0, qi + 1) : text;
  return cut.replace(/\s+/g, " ").trim().toLowerCase();
}

export function filterMechanicProblemRows<
  T extends { label: string; answer: string },
>(rows: T[]): T[] {
  const startRow = rows.find(
    (r) => questionKey(r.label) === questionKey(MECHANIC_START_QUESTION),
  );
  if (!startRow) return rows;
  const startOpt = MECHANIC_START_OPTIONS.find(
    (o) => o.label === startRow.answer,
  );
  if (!startOpt) return rows;

  const reconstructed: Record<string, string> = {
    start: startOpt.id,
    start_label: startRow.answer,
  };
  for (const [id, screen] of Object.entries(MECHANIC_SCREENS)) {
    const row = rows.find(
      (r) => questionKey(r.label) === questionKey(screen.question),
    );
    if (!row) continue;
    const opt = screen.options?.find((o) => o.label === row.answer);
    reconstructed[id] = opt?.id ?? row.answer;
    reconstructed[`${id}_label`] = row.answer;
  }
  reconstructed.start = startOpt.id;
  reconstructed.start_label = startRow.answer;

  const path = answeredScreenPath(reconstructed, nextMechanicScreen);
  const keep = new Set<string>([
    questionKey(MECHANIC_FINAL_COPY.location),
    questionKey(MECHANIC_FINAL_COPY.extra),
    questionKey(MECHANIC_FINAL_COPY.diagnosis),
  ]);
  for (const id of path) {
    const screen = mechanicScreen(id, reconstructed);
    if (screen) keep.add(questionKey(screen.question));
  }
  const trimmed = rows.filter((r) => keep.has(questionKey(r.label)));
  return trimmed.length ? trimmed : rows;
}

export function composeMechanicProblem(
  answers: Record<string, string>,
  extra: string,
  landmark: string,
): string {
  const path = answeredScreenPath(answers, nextMechanicScreen);
  const scoped = pickAnswersOnPath(answers, path);
  const lines = qaLinesForPath({
    answers: scoped,
    next: nextMechanicScreen,
    screenOf: mechanicScreen,
  });

  if (landmark.trim()) {
    lines.push(MECHANIC_FINAL_COPY.location);
    lines.push(landmark.trim());
  }
  if (extra.trim()) {
    lines.push(MECHANIC_FINAL_COPY.extra);
    lines.push(extra.trim());
  }
  const diagnosis = mechanicDiagnosis(scoped);
  if (diagnosis) {
    lines.push(MECHANIC_FINAL_COPY.diagnosis);
    lines.push(diagnosis);
  }
  return lines.filter(Boolean).join("\n");
}

export function canAdvanceText(value: string): boolean {
  return value.trim().length >= 2;
}

export function canFindMechanicPro(photoCount: number): boolean {
  return photoCount >= MECHANIC_MIN_PHOTOS;
}

export function mechanicBreadcrumb(stack: string[]): string {
  const bits: string[] = ["Mechanic"];
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
