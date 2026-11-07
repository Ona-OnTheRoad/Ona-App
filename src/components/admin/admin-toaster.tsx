"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { Toaster as Sonner } from "sonner";

/**
 * The admin console's snackbar host. Mounted once in the admin layout (inside
 * `.om-admin-root`, so it inherits the `--om-*` tokens). Follows the admin's
 * own light/dark theme, which is independent of the consumer app's theme.
 * Fire toasts with `toastSuccess` / `toastError` / `toastInfo` from `@/lib/toast`.
 */
export function AdminToaster() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setTheme(el.dataset.theme === "dark" ? "dark" : "light");
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return (
    <Sonner
      theme={theme}
      position="top-right"
      offset={16}
      mobileOffset={16}
      visibleToasts={4}
      icons={{
        success: (
          <CircleCheck
            className="h-5 w-5"
            style={{ color: "var(--om-success)" }}
            aria-hidden
          />
        ),
        error: (
          <CircleAlert
            className="h-5 w-5"
            style={{ color: "var(--om-danger)" }}
            aria-hidden
          />
        ),
        info: (
          <Info
            className="h-5 w-5"
            style={{ color: "var(--om-text-muted)" }}
            aria-hidden
          />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--om-panel-2)",
          "--normal-text": "var(--om-text)",
          "--normal-border": "var(--om-border)",
          "--border-radius": "10px",
          fontFamily: "var(--om-font)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "text-[13px] font-semibold shadow-lg",
          description: "opacity-70",
        },
      }}
    />
  );
}
