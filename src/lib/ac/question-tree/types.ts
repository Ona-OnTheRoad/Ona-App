import type { ProService } from "@/lib/types";

export type AcScreenKind = "choice" | "text";

export type AcOption = {
  id: string;
  label: string;
};

export type AcScreen = {
  id: string;
  question: string;
  kind: AcScreenKind;
  options?: AcOption[];
  placeholder?: string;
};

export type AcRoute = {
  trade: ProService;
  needsConfirm: boolean;
};
