"use client";

import { useEffect, useState } from "react";

/**
 * Watch the data attribute set by AppMenu so we can reposition the dashboard
 * horizontally when the sidebar opens (left portion becomes visible in the
 * right 20% gap).
 */
export function useMenuOpen(): boolean {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const phone = document.getElementById("ona-phone");
    if (!phone) return;
    setMenuOpen(phone.dataset.menuOpen === "true");
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-menu-open") {
          setMenuOpen(phone.dataset.menuOpen === "true");
        }
      }
    });
    observer.observe(phone, { attributes: true });
    return () => observer.disconnect();
  }, []);
  return menuOpen;
}
