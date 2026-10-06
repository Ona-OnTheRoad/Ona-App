import type { ProService } from "@/lib/types";

export type ElectricalScreenKind = "choice" | "text";

export type ElectricalOption = {
  id: string;
  label: string;
};

export type ElectricalScreen = {
  id: string;
  question: string;
  kind: ElectricalScreenKind;
  options?: ElectricalOption[];
  placeholder?: string;
};

export type ElectricalRoute = {
  trade: ProService;
  needsConfirm: boolean;
};
