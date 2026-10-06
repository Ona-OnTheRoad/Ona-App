import type { BodyOption } from "./types";

export const BODY_START_OPTIONS: BodyOption[] = [
  { id: "A", label: "Accident or collision damage" },
  { id: "B", label: "Dent(s) on the body" },
  { id: "C", label: "Scratch or paint damage" },
  { id: "D", label: "Bumper damaged or hanging" },
  { id: "E", label: "Door, fender, or bonnet damage" },
  { id: "F", label: "Need full panel beating and spraying" },
  { id: "G", label: "Something else / I'm not sure" },
];

export const YES_NO: BodyOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
