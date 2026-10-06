export interface PainterOption {
  id: string;
  label: string;
  hint?: string;
}

export interface PainterScreen {
  question: string;
  kind: "choice" | "text";
  options?: PainterOption[];
  placeholder?: string;
}
