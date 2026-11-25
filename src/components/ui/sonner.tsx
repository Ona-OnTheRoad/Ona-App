"use client";

import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useApp } from "@/lib/store";

/**
 * Sonner is `position: fixed`, so it ignores the phone shell's own safe-area padding. Without the
 * inset a toast sits under the status bar / notch / Dynamic Island on an installed (standalone) app.
 */
const TOAST_OFFSET = {
  top: "calc(env(safe-area-inset-top, 0px) + 12px)",
  left: 16,
  right: 16,
  bottom: 16,
};

/**
 * shadcn-style Sonner toaster: the app's one snackbar for success / error /
 * info feedback (see src/lib/toast.ts). Mount once inside the phone shell so
 * `position: fixed` resolves to #ona-phone. Colours come from the Ona tokens.
 */
export function Toaster(props: ToasterProps) {
  const { theme } = useApp();
  return (
    <Sonner
      theme={theme === "light" ? "light" : "dark"}
      position="top-center"
      offset={TOAST_OFFSET}
      mobileOffset={TOAST_OFFSET}
      visibleToasts={3}
      icons={{
        success: (
          <CircleCheck className="h-5 w-5 text-ona-success" aria-hidden />
        ),
        error: <CircleAlert className="h-5 w-5 text-ona-danger" aria-hidden />,
        info: <Info className="h-5 w-5 text-ona-muted" aria-hidden />,
      }}
      style={
        {
          "--normal-bg": "var(--o-surface)",
          "--normal-text": "var(--o-ink)",
          "--normal-border": "var(--o-border)",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "text-[14px] font-medium shadow-lg",
          description: "text-ona-muted",
        },
      }}
      {...props}
    />
  );
}
