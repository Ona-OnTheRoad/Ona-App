import { useEffect, useLayoutEffect } from "react";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** How many mounted screens currently want to draw behind the status bar. */
let holders = 0;

/**
 * Let this screen's background / map run behind the status bar, notch and Dynamic Island.
 * The phone shell stops padding the top while at least one screen holds this; the screen must pad
 * its own content with `env(safe-area-inset-top)` so nothing interactive sits under the island.
 */
export function useEdgeToEdgeTop(enabled = true): void {
  useIsoLayoutEffect(() => {
    if (!enabled) return;
    const phone = document.getElementById("ona-phone");
    if (!phone) return;
    holders += 1;
    phone.setAttribute("data-edge-top", "");
    return () => {
      holders = Math.max(0, holders - 1);
      if (holders === 0) phone.removeAttribute("data-edge-top");
    };
  }, [enabled]);
}
