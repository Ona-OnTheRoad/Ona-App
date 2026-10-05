import type { ReactNode } from "react";

/** Borderless `om-admin-form` used inside admin panels that supply their own padding. */
export function PlainForm({ children }: { children: ReactNode }) {
  return (
    <div
      className="om-admin-form"
      style={{
        maxWidth: "none",
        border: 0,
        boxShadow: "none",
        padding: 0,
        background: "transparent",
      }}
    >
      {children}
    </div>
  );
}
