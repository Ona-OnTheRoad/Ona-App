export interface CarpenterOption {
  id: string;
  label: string;
  hint?: string;
}

export interface CarpenterScreen {
  question: string;
  kind: "choice" | "text";
  options?: CarpenterOption[];
  placeholder?: string;
}
