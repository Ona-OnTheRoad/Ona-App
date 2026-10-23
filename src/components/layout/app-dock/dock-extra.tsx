"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { MyServiceSection } from "@/components/layout/app-menu/my-service-section";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store";

/** The dock has no close handle, so extra actions close its sheet via Escape (its own key handler). */
export function closeDockSheet() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
}

/** What the More sheet carries besides links: My Service (Repair Pro) and Log out. */
export function DockExtra() {
  const t = useT();
  const router = useRouter();
  const { accountType, proServices } = useApp();
  const isPro = accountType === "professional";

  return (
    <div className="flex flex-col gap-1 pb-3">
      {isPro && proServices.length > 0 ? (
        <MyServiceSection proServices={proServices} />
      ) : null}
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
