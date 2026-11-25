"use client";

import { useEdgeToEdgeTop } from "@/lib/use-edge-to-edge-top";

/** Render inside a screen that should run behind the status bar (see useEdgeToEdgeTop). */
export function EdgeToEdgeTop() {
  useEdgeToEdgeTop();
  return null;
}
