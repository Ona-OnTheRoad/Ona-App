import type { ProService } from "@/lib/types";

export type ScanScreenKind = "choice" | "text";

export type ScanOption = {
  id: string;
  label: string;
};

export type ScanScreen = {
  id: string;
  question: string;
  kind: ScanScreenKind;
  options?: ScanOption[];
  placeholder?: string;
};

export type ScanRoute = {
  trade: ProService;
  alternate?: ProService;
  needsConfirm: boolean;
};
