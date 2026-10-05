export interface PlumberOption {
  id: string;
  label: string;
  hint?: string;
}

export interface PlumberScreen {
  question: string;
  kind: "choice" | "text";
  options?: PlumberOption[];
  placeholder?: string;
}
