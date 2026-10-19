import { useEffect } from "react";

/**
 * react-floating-dock portals its sheet to <body>. Publish the phone shell's
 * rectangle as CSS variables so globals.css can pin that overlay to the shell
 * instead of the whole browser window (docs/UI.md: overlays stay in #ona-phone).
 */
export function usePhoneRect() {
  useEffect(() => {
    const phone = document.getElementById("ona-phone");
    if (!phone) return;
    const root = document.documentElement;
    const apply = () => {
      const r = phone.getBoundingClientRect();
      root.style.setProperty("--ona-phone-left", `${r.left}px`);
      root.style.setProperty("--ona-phone-top", `${r.top}px`);
      root.style.setProperty("--ona-phone-width", `${r.width}px`);
      root.style.setProperty("--ona-phone-height", `${r.height}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(phone);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, []);
}
