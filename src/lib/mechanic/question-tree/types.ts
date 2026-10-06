import type { ProService } from "@/lib/types";

export type MechanicScreenKind = "choice" | "text";

export type MechanicOption = {
  id: string;
  label: string;
};

export type MechanicScreen = {
  id: string;
  question: string;
  kind: MechanicScreenKind;
  options?: MechanicOption[];
  placeholder?: string;
};

export type MechanicRoute = {
  trade: ProService;
  alternate?: ProService;
  needsConfirm: boolean;
  diagnosis?: string;
};
