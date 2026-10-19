"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { MyServiceSection } from "@/components/layout/app-menu/my-service-section";
import { UseAsSection } from "@/components/layout/app-menu/use-as-section";
import { useAccountSwitch } from "@/components/layout/app-menu/use-account-switch";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { AccountType } from "@/lib/types";

/** The dock has no close handle, so extra actions close its sheet via Escape (its own key handler). */
export function closeDockSheet() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
}

/** What the More sheet carries besides links: My Service (Repair Pro), Use-as role switch and Log out. */
export function DockExtra() {
  const t = useT();
  const router = useRouter();
  const { accountType, proServices, hasMotoristAccount, hasProAccount } =
    useApp();
  const isPro = accountType === "professional";
  const { warn, signupTarget, switching, onSwitch } = useAccountSwitch(
    true,
    closeDockSheet,
  );
  const useAsOrder: AccountType[] =
    hasMotoristAccount && hasProAccount && accountType === "professional"
      ? ["professional", "motorist"]
      : ["motorist", "professional"];

  return (
    <div className="flex flex-col gap-1 pb-3">
      {isPro && proServices.length > 0 ? (
        <MyServiceSection proServices={proServices} />
      ) : null}
      <UseAsSection
        accountType={accountType}
        hasMotoristAccount={hasMotoristAccount}
        hasProAccount={hasProAccount}
        useAsOrder={useAsOrder}
        switching={switching}
        warn={warn}
        signupTarget={signupTarget}
        onSwitch={onSwitch}
        onClose={closeDockSheet}
      />
      <button
        type="button"
        onClick={() => {
          closeDockSheet();
          router.push("/logout");
        }}
        className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-ona-ctl border-0 bg-ona-brand-soft text-[14px] font-semibold text-ona-brand-ink"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        {t("menu.logOut")}
      </button>
    </div>
  );
}
