"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";

/** Right-side detail drawer for full review + actions */
export function DetailDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  headerAction,
  width = 420,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Rendered in the header beside the Close button (e.g. a Save action) */
  headerAction?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="om-admin-drawer-root" role="dialog" aria-modal>
      <button
        type="button"
        className="om-admin-drawer-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <aside
        className="om-admin-drawer"
        style={{ width: `min(${width}px, 100vw)` } as CSSProperties}
      >
        <header className="om-admin-drawer-head">
          <div className="om-admin-drawer-titles">
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {headerAction}
            <button
              type="button"
              className="om-admin-btn ghost"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </header>
        <div className="om-admin-drawer-body">{children}</div>
        {footer ? (
          <footer className="om-admin-drawer-foot">{footer}</footer>
        ) : null}
      </aside>
    </div>
  );
}
