export const GEN_START_OPTIONS = [
  { id: "A", label: "New generator installation or purchase advice" },
  { id: "B", label: "Generator will not start" },
  { id: "C", label: "Generator starts but does not give power" },
  { id: "D", label: "Generator servicing or maintenance" },
  { id: "E", label: "Change-over switch or wiring problem" },
  {
    id: "F",
    label: "Generator overheating, smoking or making unusual noise",
  },
  { id: "G", label: "Something else / I'm not sure" },
] as const;
