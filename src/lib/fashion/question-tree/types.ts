import type { ProService } from "@/lib/types";

export type FashionScreenKind = "choice" | "text";

export type FashionOption = {
  id: string;
  label: string;
};

export type FashionScreen = {
  id: string;
  question: string;
  kind: FashionScreenKind;
  options?: FashionOption[];
  placeholder?: string;
};

export type FashionRoute = {
  trade: ProService;
  needsConfirm: boolean;
};
