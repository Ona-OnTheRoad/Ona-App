"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { clearSignupDraft } from "@/lib/signup-draft";
import { useApp } from "@/lib/store";

/**
 * Once someone is signed in, any half-finished signup details (name, email,
 * phone…) are dropped so the next Sign Up on this device starts empty. The
 * signup routes themselves are skipped because menu/profile dual-role signup is
 * signed in and still needs its draft.
 */
export function useSignupDraftCleanup() {
  const { isAuthenticated } = useApp();
  const pathname = usePathname() || "";
  useEffect(() => {
    if (isAuthenticated && !pathname.startsWith("/signup")) clearSignupDraft();
  }, [isAuthenticated, pathname]);
}
