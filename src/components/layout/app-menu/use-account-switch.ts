import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { resetNavStack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import type { AccountType } from "@/lib/types";
import { afterPaint, waitUntil } from "@/lib/wait-for-route";
import { homeForRole } from "./menu-nav";

export function useAccountSwitch(open: boolean, onClose: () => void) {
  const router = useRouter();
  const pathname = usePathname();
  // Latest committed route, readable from the async switch below.
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);
  const t = useT();
  const { accountType, switchAccount, isAuthenticated } = useApp();
  const [warn, setWarn] = useState<string | null>(null);
  const [signupTarget, setSignupTarget] = useState<AccountType | null>(null);

  useEffect(() => {
    if (!open) return;
    setWarn(null);
    setSignupTarget(null);
  }, [open]);

  const [switching, setSwitching] = useState(false);

  const onSwitch = async (type: AccountType) => {
    // Already on this role → only navigate to its home page
    if (
      (type === "motorist" && accountType === "motorist") ||
      (type === "professional" && accountType === "professional")
    ) {
      onClose();
      router.replace(homeForRole(type));
      return;
    }

    if (!isAuthenticated) {
      setWarn(t("menu.needLogin"));
      setSignupTarget(null);
      return;
    }

    // Do not block on client-only dual flags here switchAccount refreshes
    // from the server (vault alone was falsely saying "no Repair Pro account").
    setWarn(null);
    setSignupTarget(null);
    setSwitching(true);
    try {
      // Navigate while the "Switching account…" cover is still up and keep it until the new home
      // is actually on screen, so the user never sees the old route in the new role.
      const target = homeForRole(type);
      const goHome = async () => {
        resetNavStack(target);
        onClose();
        if (pathRef.current !== target) {
          router.replace(target);
          await waitUntil(() => pathRef.current === target);
        }
        await afterPaint();
      };
      let result = await switchAccount(type, { afterSwitch: goHome });
      // Cold-start / navigation race: the very first tap can hit a session that
      // is still rehydrating (getSession empty) and fail; a manual re-tap then
      // succeeds. Absorb it here with ONE automatic retry so users never have
      // to tap twice. Real needs_* outcomes are not retried and surfaced as-is.
      if (
        result !== null &&
        result !== "needs_login" &&
        result !== "needs_signup"
      ) {
        try {
          const { ensureAppSession } = await import("@/lib/supabase/session");
          await ensureAppSession({
            waitForSessionMs: 2200,
            forceRefresh: true,
          });
        } catch {
          /* retry anyway */
        }
        result = await switchAccount(type, { afterSwitch: goHome });
      }
      // On success the navigation already happened inside switchAccount (behind the cover).
      if (result === null) return;
      if (result === "needs_login") {
        setWarn(t("menu.needLogin"));
        return;
      }
      if (result === "needs_signup") {
        setSignupTarget(type);
        setWarn(
          type === "professional" ? t("menu.noPro") : t("menu.noMotorist"),
        );
        return;
      }
      setWarn(typeof result === "string" ? result : t("menu.couldNotSwitch"));
    } finally {
      setSwitching(false);
    }
  };

  return { warn, signupTarget, switching, onSwitch };
}
