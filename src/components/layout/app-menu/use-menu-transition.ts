import { useEffect, useState } from "react";

/**
 * Drawer + capsule share one clock (MENU_MS). Stay mounted on exit so both
 * finish together fixes capsule appearing early / “paused” open.
 * Ona X stays removed. Chip row is separate (data-menu-open).
 */
const MENU_MS = 200;

export function useMenuTransition(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setExiting(false);
      return;
    }
    if (!mounted) return;
    setExiting(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setExiting(false);
    }, MENU_MS);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  // Signal menu state to home panel for chip row slide
  useEffect(() => {
    const phone = document.getElementById("ona-phone");
    if (!phone) return;
    if (open) {
      phone.dataset.menuOpen = "true";
    } else {
      delete phone.dataset.menuOpen;
    }
  }, [open]);

  return { mounted, exiting };
}
