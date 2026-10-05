import type { ProService } from "@/lib/types";

export interface SolarOption {
  id: string;
  label: string;
  hint?: string;
}

export interface SolarScreen {
  question: string;
  kind: "choice" | "text";
  options?: SolarOption[];
  placeholder?: string;
}

export interface SolarRoute {
  trade: ProService;
  alternate?: ProService;
  needsConfirm: boolean;
}
