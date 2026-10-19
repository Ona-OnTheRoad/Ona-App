"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Car, Check, Wrench } from "lucide-react";
import { useAuthNavigate } from "@/components/auth/auth-transition";
import { Button } from "@/components/ui/button";
import { OnaScreen, OnaTitle } from "@/components/ui/ona-screen";
import { useT } from "@/lib/i18n";
import {
  clearSignupDraft,
  loadSignupDraft,
  signupHref,
} from "@/lib/signup-draft";
import type { AccountType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Role selection: account-type step before signup. */
export function LoginScreen() {
  const { exiting, go } = useAuthNavigate();
  const t = useT();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref");
  const [ready, setReady] = useState(false);

  // Sign-up starts at /signup (details first). Guest paths that still push
  // /login/role land here and are forwarded when no details were saved yet.
  useEffect(() => {
    if (loadSignupDraft()) setReady(true);
    else router.replace(signupHref("/signup", { ref }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** No default: user must pick Car Owner or Repair Pro */
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountType) return;
    const dest =
      accountType === "professional" ? "/signup/pro" : "/signup/motorist";
    go(signupHref(dest, { ref }));
  };

  const goBack = () => go(signupHref("/signup/verify", { ref }));

  if (!ready) return <div className="ona2 h-full" aria-busy="true" />;

  return (
    <form onSubmit={onSubmit} className="h-full min-h-0">
      <OnaScreen
        wordmark
        exiting={exiting}
        onBack={goBack}
        footer={
          <div className="flex flex-col gap-3">
            <Button
              size="ona"
              variant="ona"
              type="submit"
              disabled={!accountType}
              data-cta="continue-signup"
            >
              Proceed
            </Button>
            <p className="text-center text-[12px] text-ona-muted">
              Already have an account?{" "}
              <button
                type="button"
                className="inline-flex min-h-11 items-center border-0 bg-transparent p-0 font-semibold text-ona-brand-ink underline underline-offset-2"
                onClick={() => {
                  clearSignupDraft();
                  go("/login/signin");
                }}
              >
                Log in
              </button>
            </p>
          </div>
        }
      >
        <OnaTitle
          title="How will you use Ona?"
          subtitle={t("auth.chooseHow")}
        />
        <div
          className="mt-5 grid grid-cols-2 gap-3"
          role="radiogroup"
          aria-label="Account type"
        >
          <RoleCard
            active={accountType === "motorist"}
            icon={Car}
            title={t("auth.motorist")}
            subtitle={t("auth.motoristHint")}
            onClick={() => setAccountType("motorist")}
          />
          <RoleCard
            active={accountType === "professional"}
            icon={Wrench}
            title={t("auth.pro")}
            subtitle={t("auth.proHint")}
            onClick={() => setAccountType("professional")}
          />
        </div>
        <p
          className="mt-4 text-center text-[12px] leading-relaxed text-ona-muted"
          aria-live="polite"
        >
          {!accountType
            ? t("auth.tapRole")
            : accountType === "professional"
              ? t("auth.about2min")
              : t("auth.about1min")}
        </p>
      </OnaScreen>
    </form>
  );
}

function RoleCard({
  active,
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  icon: typeof Car;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "relative flex min-h-[200px] flex-col items-start gap-3 rounded-ona-card border bg-ona-surface p-3 text-left transition-colors",
        active
          ? "border-2 border-ona-brand bg-ona-brand-soft"
          : "border-ona-border",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-20 w-full items-center justify-center rounded-ona-ctl",
          active
            ? "bg-ona-brand-btn text-white"
            : "bg-ona-field-strong text-ona-brand-ink",
        )}
      >
        <Icon className="h-9 w-9" strokeWidth={1.75} />
      </span>
      {active ? (
        <span
          aria-hidden
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ona-brand-btn text-white"
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : null}
      <span className="block text-[14px] font-bold leading-tight text-ona-ink">
        {title}
        {active ? <span className="sr-only"> (selected)</span> : null}
      </span>
      <span className="block text-[12px] leading-snug text-ona-muted">
        {subtitle}
      </span>
    </button>
  );
}
