import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import type { AccountType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function UseAsSection({
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
      "h-10 rounded-[8px] border-0 px-2 text-[13px] font-semibold transition-colors",
      active
        ? "bg-ona-surface text-ona-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
        : "bg-transparent text-ona-muted",
    );

  return (
    <div className="mt-2">
      <p className="mb-1.5 text-[12px] font-semibold text-ona-ink">
        {t("menu.useAs")}
      </p>
      {hasMotoristAccount && hasProAccount ? (
        <p className="mb-1.5 text-[12px] font-semibold text-ona-brand-ink">
          Dual Role
        </p>
      ) : null}
      <div
        className={cn(
          "grid grid-cols-2 gap-1 rounded-ona-ctl bg-ona-field-strong p-1",
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
                    className="h-3.5 w-3.5 animate-spin text-ona-brand-ink"
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
            "mt-1.5 rounded-ona-ctl bg-ona-field px-3 py-2 text-[12px] font-medium leading-snug text-ona-ink",
          )}
          role="alert"
        >
          <p>{warn}</p>
          {signupTarget && (
            <button
              type="button"
              className="mt-1 border-0 bg-transparent p-0 text-[11px] font-bold text-ona-brand-ink underline"
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
              className="mt-1 border-0 bg-transparent p-0 text-[11px] font-bold text-ona-brand-ink underline"
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
        <p className="mt-1.5 text-[11px] leading-snug text-ona-muted">
          {t("menu.tapToSwitch")}
        </p>
      )}
    </div>
  );
}
