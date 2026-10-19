"use client";

import { BrandEntryScreen } from "@/components/auth/brand-entry-screen";
import {
  BrandHeroMotion,
  BRAND_COPPER,
} from "@/components/auth/brand-hero-motion";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function WelcomeLayer({
  animateIn,
  entryExiting,
  finishEntry,
}: {
  animateIn: boolean;
  entryExiting: boolean;
  finishEntry: (path: string) => void;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden",
        animateIn && "om-auth-enter",
        entryExiting && "om-auth-exit",
      )}
      style={{ backgroundColor: BRAND_COPPER }}
    >
      <BrandEntryScreen
        onLogIn={() => finishEntry("/login/signin")}
        onSignUp={() => finishEntry("/signup")}
        animateIn={animateIn}
      />
    </div>
  );
}

/** Brand portrait (auth-bg-v31) + Loading text not the Welcome intro page */
export function SplashLayer({ splashExiting }: { splashExiting: boolean }) {
  const t = useT();
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 overflow-hidden om-intro-splash-layer",
        splashExiting && "is-exiting",
      )}
      style={{ backgroundColor: BRAND_COPPER }}
      aria-hidden={splashExiting}
      aria-label={t("common.loading")}
    >
      <BrandHeroMotion size="splash" bottomFade={false} motion introMotion />
      <p
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-10 z-10 text-center text-[12px] font-medium transition-opacity duration-200",
          splashExiting ? "opacity-0" : "opacity-90",
        )}
        style={{ color: "#C8C9CD" }}
      >
        {t("common.loading")}
      </p>
    </div>
  );
}
