import type { ProService } from "@/lib/types";

export interface GenScreen {
  kind: "choice" | "text";
  question: string;
  placeholder?: string;
  options?: { id: string; label: string }[];
}

export interface GenRoute {
  trade: ProService;
  alternate: ProService;
  needsConfirm: boolean;
}
