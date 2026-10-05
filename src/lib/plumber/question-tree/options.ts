import type { PlumberOption } from "./types";

export const PLUMBER_START_OPTIONS: PlumberOption[] = [
  { id: "A", label: "No water or very low water pressure" },
  { id: "B", label: "Water leakage" },
  { id: "C", label: "Blocked drain, sink, or toilet" },
  { id: "D", label: "Faulty or damaged tap / shower / mixer" },
  { id: "E", label: "Water heater / geyser problem" },
  { id: "F", label: "Toilet flushing problem" },
  { id: "G", label: "New installation or complete plumbing work" },
  { id: "H", label: "Something else / I’m not sure" },
];

export const PLUMBER_PROPERTY_OPTIONS: PlumberOption[] = [
  { id: "house", label: "House" },
  { id: "flat", label: "Flat" },
  { id: "shop", label: "Shop" },
  { id: "office", label: "Office" },
  { id: "other", label: "Other" },
];
