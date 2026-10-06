import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { resetNavStack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import type { AccountType } from "@/lib/types";
import { homeForRole } from "./menu-nav";

export function useAccountSwitch(open: boolean, onClose: () => void) {
  const router = useRouter();
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
      let result = await switchAccount(type);
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
        result = await switchAccount(type);
      }
      if (result === null) {
        // Only “Use as” switches roles reset stack so Back stays in this role
        resetNavStack(homeForRole(type));
        onClose();
        router.replace(homeForRole(type));
        return;
      }
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
