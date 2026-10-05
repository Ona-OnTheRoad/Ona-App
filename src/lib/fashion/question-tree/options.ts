import type { FashionOption } from "./types";

export const FASHION_START_OPTIONS: FashionOption[] = [
  { id: "A", label: "New custom-made outfit (Native or English)" },
  { id: "B", label: "Aso-Ebi / Group or family uniform" },
  { id: "C", label: "Alteration, adjustment or restyling of existing clothes" },
  { id: "D", label: "Repair of torn, damaged or worn clothes" },
  { id: "E", label: "Ready-to-wear / Off-the-rack purchase & fitting" },
  { id: "F", label: "Fashion design consultation or style advice" },
  { id: "G", label: "Something else / I'm not sure" },
];

export const YES_NO: FashionOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
