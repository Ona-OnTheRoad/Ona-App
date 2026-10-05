import {
  appleProFieldClass,
  appleProSelectClass,
  appleProTextareaClass,
} from "@/components/pro/apple-pro-wizard";
import { cn } from "@/lib/utils";

/** Apple premium: hairline fields on single sheet (no nested gray wells) */
export function proFieldStyles(isLight: boolean) {
  return {
    fieldClass: appleProFieldClass(isLight),
    fieldIconClass: cn(appleProFieldClass(isLight), "pl-8"),
    selectClass: appleProSelectClass(isLight),
    textareaClass: appleProTextareaClass(isLight),
    fieldStyle: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      color: isLight ? "#1c1c1e" : "#ffffff",
      boxShadow: "none",
    } as const,
  };
}

export type ProFieldStyles = ReturnType<typeof proFieldStyles>;
