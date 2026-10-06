import type { ProService } from "@/lib/types";

export type VulcanizerScreenKind = "choice" | "text";

export type VulcanizerOption = {
  id: string;
  label: string;
};

export type VulcanizerScreen = {
  id: string;
  question: string;
  kind: VulcanizerScreenKind;
  options?: VulcanizerOption[];
  placeholder?: string;
};

export type VulcanizerRoute = {
  trade: ProService;
  alternate?: ProService;
  needsConfirm: boolean;
  diagnosis?: string;
};
