import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import type { AccountType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function UseAsSection({
  isLight,
  accountType,
  hasMotoristAccount,
  hasProAccount,
  useAsOrder,
  switching,
  warn,
  signupTarget,
  onSwitch,
  onClose,
}: {
  isLight: boolean;
  accountType: AccountType | null;
  hasMotoristAccount: boolean;
  hasProAccount: boolean;
  useAsOrder: AccountType[];
  switching: boolean;
  warn: string | null;
  signupTarget: AccountType | null;
  onSwitch: (type: AccountType) => Promise<void>;
  onClose: () => void;
}) {
  const router = useRouter();
  const t = useT();

  const asBtnClass = (active: boolean) =>
    cn(
      "rounded-lg border-0 px-2 py-2 text-[12px] font-bold transition-colors",
      active
        ? "bg-[#323231] text-white"
        : isLight
          ? "bg-transparent text-black hover:bg-[#b0b1b6]/60"
          : "bg-transparent text-white/85 hover:bg-white/10",
    );

  return (
    <div
      className={cn(
        "mt-3 border-t pt-3",
        isLight ? "border-black/10" : "border-white/10",
      )}
    >
      <p
        className={cn(
          "mb-1 px-2 text-[10px] font-bold uppercase tracking-wide",
          isLight ? "text-black" : "text-white/55",
        )}
      >
        {t("menu.useAs")}
      </p>
      {hasMotoristAccount && hasProAccount ? (
        <p className="mb-1 px-2 text-[11px] font-bold text-[#FF6B35]">
          Dual Role
        </p>
      ) : null}
      <div
        className={cn(
          "grid grid-cols-2 gap-1 rounded-xl p-1",
          isLight ? "bg-[#bebfc4]" : "bg-[#1c1c1e]",
          switching && "opacity-70 pointer-events-none",
        )}
        role="group"
        aria-label={t("menu.switchRole")}
        aria-busy={switching}
      >
        {useAsOrder.map((role) => {
          const active = accountType === role;
          const label =
            role === "motorist" ? t("auth.motorist") : t("auth.pro");
          return (
            <button
              key={role}
              type="button"
              disabled={switching}
              onClick={() => void onSwitch(role)}
              className={cn(asBtnClass(active), switching && "relative")}
              aria-current={active ? "true" : undefined}
            >
              {switching && !active ? (
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin text-[#FF6B35]"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span className="sr-only">Switching</span>
                </span>
              ) : (
                label
              )}
            </button>
          );
        })}
      </div>
      {warn ? (
        <div
          className={cn(
            "mt-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium leading-snug",
            isLight ? "bg-black/10 text-black" : "bg-white/10 text-white",
          )}
          role="alert"
        >
          <p className={isLight ? "text-black" : "text-white"}>{warn}</p>
          {signupTarget && (
            <button
              type="button"
              className="mt-1 border-0 bg-transparent p-0 text-[11px] font-bold text-[#FF6B35] underline"
              onClick={() => {
                onClose();
                router.push(
                  signupTarget === "professional"
                    ? "/signup/pro?from=menu&attach=1&next=/dashboard"
                    : "/signup/motorist?from=menu&attach=1&next=/",
                );
              }}
            >
              {t("menu.signUpHere")}
            </button>
          )}
          {warn === t("menu.needLogin") && (
            <button
              type="button"
              className="mt-1 border-0 bg-transparent p-0 text-[11px] font-bold text-[#FF6B35] underline"
              onClick={() => {
                onClose();
                router.push("/login/signin");
              }}
            >
              {t("menu.logIn")}
            </button>
          )}
        </div>
      ) : (
        <p
          className={cn(
            "mt-1 px-2 text-[10px] font-medium leading-snug",
            isLight ? "text-black" : "text-white/55",
          )}
        >
          {t("menu.tapToSwitch")}
        </p>
      )}
    </div>
  );
}
