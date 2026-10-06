import type { ProService } from "@/lib/types";

export type BatteryScreenKind = "choice" | "text";

export type BatteryOption = {
  id: string;
  label: string;
};

export type BatteryScreen = {
  id: string;
  question: string;
  kind: BatteryScreenKind;
  options?: BatteryOption[];
  placeholder?: string;
};

export type BatteryRoute = {
  trade: ProService;
  alternate?: ProService;
  needsConfirm: boolean;
  diagnosis?: string;
};
