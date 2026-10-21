"use client";

import { useDockVisible } from "@/components/layout/app-dock";

/**
 * Frosted-glass backdrop below and behind the floating dock, mirroring iOS
 * tab bar behavior: page content scrolling underneath gets smoothly blurred
 * and feathered into the bottom home indicator / safe area.
 */
export function DockBlurBackdrop() {
  const dockVisible = useDockVisible();
  if (!dockVisible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[35] overflow-hidden"
      style={{
        height: "calc(3.75rem + env(safe-area-inset-bottom, 0px))",
        backdropFilter: "blur(5px) saturate(135%)",
        WebkitBackdropFilter: "blur(5px) saturate(135%)",
        background:
          "linear-gradient(to top, color-mix(in srgb, var(--o-surface) 38%, transparent) 0%, color-mix(in srgb, var(--o-surface) 15%, transparent) 60%, transparent 100%)",
        maskImage: "linear-gradient(to top, black 40%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to top, black 40%, transparent 100%)",
      }}
    />
  );
}
