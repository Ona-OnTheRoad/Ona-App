import type { AcOption } from "./types";

export const AC_UNIT_OPTIONS: AcOption[] = [
  { id: "vehicle", label: "Vehicle A/C" },
  { id: "home", label: "Home or office A/C" },
];

export const AC_START_OPTIONS: AcOption[] = [
  { id: "A", label: "No cold air at all" },
  { id: "B", label: "Weak or insufficient cooling" },
  { id: "C", label: "Strange noise when A/C is turned on" },
  { id: "D", label: "Bad smell coming from the vents" },
  { id: "E", label: "A/C was working then suddenly stopped" },
  {
    id: "F",
    label: "Water leaking inside the vehicle or from the A/C unit",
  },
  { id: "G", label: "Something else / I'm not sure" },
];

export const YES_NO: AcOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];

export const YES_NO_UNSURE: AcOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "unsure", label: "I'm not sure" },
];
