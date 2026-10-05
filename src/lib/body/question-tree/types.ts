import type { ProService } from "@/lib/types";

export type BodyScreenKind = "choice" | "text";

export type BodyOption = {
  id: string;
  label: string;
};

export type BodyScreen = {
  id: string;
  question: string;
  kind: BodyScreenKind;
  options?: BodyOption[];
  placeholder?: string;
};

export type BodyRoute = {
  trade: ProService;
  needsConfirm: boolean;
};
