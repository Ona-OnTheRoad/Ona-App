import type { ProService } from "@/lib/types";

export type TowScreenKind = "choice" | "text";

export type TowOption = {
  id: string;
  label: string;
};

export type TowScreen = {
  id: string;
  question: string;
  kind: TowScreenKind;
  options?: TowOption[];
  placeholder?: string;
};

export type TowRoute = {
  trade: ProService;
  alternate?: ProService;
  needsConfirm: boolean;
  /** Branch C dangerous location: prioritize the tow as an emergency. */
  emergency?: boolean;
};
